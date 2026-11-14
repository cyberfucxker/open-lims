-- Attributes an AppOrder to the franchise it was placed through, so the
-- franchise portal can list "own orders" and the franchise dashboard can
-- aggregate over them.
--
-- The organization IS already reachable — app_order_appointments -> appointments
-- -> patients.organization_id — but that path is a three-join filter on every
-- dashboard query, and it does not exist at all for draft orders (isDraft=true
-- rows have no appointments yet). Denormalising it onto the order makes the
-- franchise scope a single indexed predicate.
--
-- Stamped once at creation and never re-derived, matching the `area_id`
-- snapshot convention on this same table: reassigning a patient to a different
-- organization later must not retroactively move historical orders — and their
-- revenue — from one franchise's dashboard to another's.
--
-- NULL means a direct B2C app/web order, which is what every pre-existing row
-- stays unless the backfill below can attribute it.

-- AlterTable
ALTER TABLE "app_orders" ADD COLUMN     "organization_id" UUID;

-- CreateIndex
CREATE INDEX "app_orders_organization_id_status_idx" ON "app_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "app_orders_organization_id_order_date_idx" ON "app_orders"("organization_id", "order_date");

-- AddForeignKey
ALTER TABLE "app_orders" ADD CONSTRAINT "app_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: attribute historical orders via the join path this column replaces,
-- so franchises that were already sending patients see their existing history
-- on day one instead of an empty dashboard.
--
-- Only orders whose appointments ALL resolve to the SAME organization are
-- attributed. A multi-family-member order that somehow spans two organizations
-- is genuinely ambiguous, and guessing would misstate a franchise's revenue —
-- those stay NULL, exactly like a direct B2C order. Runs after the FK so a
-- dangling organization_id cannot be written.
UPDATE "app_orders" AS o
SET "organization_id" = src."organization_id"
FROM (
    SELECT
        aoa."order_id",
        MIN(p."organization_id"::text)::uuid AS "organization_id"
    FROM "app_order_appointments" aoa
    JOIN "appointments" a ON a."id" = aoa."appointment_id"
    JOIN "patients" p ON p."id" = a."patient_id"
    WHERE p."organization_id" IS NOT NULL
    GROUP BY aoa."order_id"
    HAVING COUNT(DISTINCT p."organization_id") = 1
) AS src
WHERE o."id" = src."order_id"
  AND o."organization_id" IS NULL;
