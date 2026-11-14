-- Optional lab-department taxonomy on Parameter, mirroring Test.departmentId
-- (see the model doc-comment) — purely informational, kept for CSV import
-- fidelity.
ALTER TABLE "parameters" ADD COLUMN "department_id" UUID;

CREATE INDEX "parameters_department_id_idx" ON "parameters"("department_id");

ALTER TABLE "parameters"
  ADD CONSTRAINT "parameters_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
