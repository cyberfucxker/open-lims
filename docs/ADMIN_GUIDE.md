# LIMS Admin — Feature Guide

The day-to-day lab operations app (`frontend/`) — registering patients,
collecting samples, entering results, printing reports and invoices, and
managing the franchise/referral/marketing side of the business. Runs on the same backend as the rest of the platform.

Staff logins (lab staff + Collection-Center franchise partners) share one
`User`/`Role` table. Lab staff (`ADMIN`) land on `/admin/dashboard`; a
franchise partner (`FRANCHISE`) lands on their own restricted
`/portal/dashboard` — same login screen, same backend, different landing
page and menu based on role.

This is a living reference — update it whenever a LIMS feature is added,
changed, or removed.

---

## 1. Login &amp; Roles
One login screen for everyone; the backend's returned role decides where
you land — lab staff (`ADMIN`) go to `/admin/dashboard`, a franchise
partner (`FRANCHISE`) goes to their own restricted `/portal/dashboard`.
- **Options:** username/password, "Remember me", "Forgot Password" dialog, Logout.
- **How it works:** JWT-based session; a `ProtectedRoute` wrapper checks
  the logged-in role against each route's allowed-roles list and bounces
  anyone in the wrong place back to their own dashboard.

## 2. Dashboard
Landing screen with a Today/Week/Month/All-Time toggle showing live
totals: billing (collected/due/discount), reports generated vs pending,
registrations (paid/pending/discounted), a B2B panel, Top Referrals, a
cash-vs-online payment split, and a Top Tests panel.
- **Options:** period selector, "+ New Patient" shortcut, quick-action links.

## 3. Patient Registration (this is also the "booking" screen)
One combined screen: register a new patient AND build their test order in
the same action — there's no separate "book appointment" step.
- **Options:** identity fields (title/name/gender/DOB with auto age/mobile/email/address),
  a **Home Collection** toggle, center, organization (B2B), referring
  doctor/referral source, WhatsApp/SMS/Email opt-ins, a searchable test
  catalogue (typeahead over ~4,000 tests), a selected-tests panel, discount
  %, payment mode, amount paid — subtotal/discount/total compute live as
  you go.
- **How it works:** Saving creates the Patient, the Appointment (order),
  and the Bill together in one transaction. Keyboard shortcuts: Ctrl/Cmd+Enter
  to save, Alt+A to jump into test search. The form resets itself for the
  next patient after a success animation.

## 4. Patient Search / Management
Search and manage every registered patient.
- **Options:** search by name/ID/mobile, an Advanced Search filter panel,
  sortable table (ID, name/gender/age, mobile, doctor, franchise,
  department, registration date, status), View Details (slide-over), Print,
  Export as Excel, Print current page.

## 5. Billing (Bill List)
View and manage every invoice raised.
- **Options:** tabs for All/Due/Paid/Free/Cancelled, search by
  name/bill#/appointment#/mobile, Emergency filter, date range, View/Print
  invoice, Download PDF, Send Invoice (email/WhatsApp/SMS), Cancel Bill
  (only while still Active), Export Excel/PDF.

## 6. Sample Collection Workflow
The specimen-tracking screen every sample passes through.
- **Status tabs:** Pending → Collected → Received → Approved → Rejected →
  Completed → All, each with a live count.
- **Options:** search by patient/sample#/appointment#, Emergency/STAT
  filter, date range; per-row actions driven by current status — Collect,
  Receive, Approve, Print Tube Label, History, Reject (with reason);
  checkbox multi-select for **bulk** Collect/Receive/Approve/Print Labels;
  Export Excel.
- **How it works — Scan Mode:** press Alt+S to focus a barcode-scanner
  input; scanning a sample number and hitting Enter auto-fires the right
  action for its current status (Collect if Pending, Receive if
  Collected) — no mouse needed on a busy collection desk.
- **Setup masters** (under Master Management):
  - **Containers** — specimen tube/container types, with a colour swatch, active toggle, soft-delete + restore.
  - **Sample Rules** — maps each Test to its required container, fasting rule, STAT/temperature/volume requirements.
  - **Barcode Settings** — per-sample-type prefix + number-length, with a live format preview (e.g. `BL0001`).

## 7. Lab Report Entry / Result Entry
Three linked screens, all gated on "has the sample actually been received/approved yet?":
- **Report Entry** — one row per ordered test: Result / Unit / Reference
  Range / Method / Flag (Normal/Low/High/Critical Low/Critical High) /
  Critical checkbox / Remarks. Save Draft, Submit, Send Back (reject with
  reason), Approve, Cancel Report.
- **Generate Reports** — a per-test worklist (cards per patient/bill)
  showing each test's own approval state; "Create Report"/"Continue"/"View"
  per test, blocked until that test's sample is Approved.
- **Test Report Entry** (parameter-level, for panels) — a
  Result/Machine Value/UOM/Reference Range/Flag/Highlight row per
  parameter, with an Auto-Calculation toggle; approval requires picking one
  or more **Signatories** up to the configured minimum-signatures count.

## 8. Report List / Print / Delivery
The full report register.
- **Status tabs:** Pending/Received/Processing/Partial/Submitted/Approved/Printed/Cancelled/All.
- **Options:** search, Emergency filter, date range, View/Print, jump to
  Report Entry, Download PDF, History, Cancel Report (blocked once
  Printed/Cancelled), multi-select **Group Print** (batch PDF of several
  reports at once), Export Excel.

## 9. Report Settings ("Report Designer") &amp; Signatories
- **Report Settings** — a live-preview branding/layout editor: logo,
  header/footer/signature/watermark images, lab name, primary colour,
  header/footer text, watermark mode (None/Text/Image), page size
  (A4/Letter), font size, row spacing, margins, barcode position + show
  barcode/QR/page-number toggles, minimum signatures required, and
  checkboxes for which patient fields (ID, Age/Gender, Mobile, Bill No,
  dates, Emergency flag, Status) and which result columns (Unit, Reference
  Range, Method, Remarks, Flag) actually print. Save / Reset / Restore
  Default (factory reset).
- **Signatories** — the doctors/pathologists selectable at report
  approval: name, title, passkey, signature image, Active toggle, delete.

## 10. Test / Package Catalogue (LIMS side)
A LIMS-local view of the catalogue.
- **Options:** searchable/filterable list (category, department, status),
  View/Edit/Delete, Export CSV, "Add Test" (name, short name, department,
  category, price, sample type, report time, reference range, status,
  description); a Packages tab to bundle tests into a priced package.
- **How "Shadow Tests" work:** every Parameter marked independently
  bookable (`doTest`) automatically gets its own single-parameter Test
  created/retired behind the scenes, so it's bookable through the same
  Test pipeline as everything else in this catalogue — there's never a
  separate "Parameter" code path to manage on top of Tests.

## 11. Master Management (catalogue setup)
Same CRUD pattern (search, active/inactive filter, "show deleted" toggle,
soft-delete + Restore) across:
- **Centers** — the lab's own branches/collection points.
- **Departments** — internal lab departments used across the catalogue.
- **Categories** — test categories, scoped to a Department.
- **Sample Types** — specimen types (Blood, Urine, ...).

## 12. B2B / Organizations &amp; Price Lists
- **Organizations** — manage B2B partners: General Center or Collection
  Center type; contact/location; portal-login enabled flag; active toggle;
  soft-delete/restore; View/Edit; Export Excel/PDF.
- **Organization Form** — name/type/contact/address, assigned **Price
  List**, payment terms (Prepaid / credit limit / advance / due days),
  report/bill delivery channels (WhatsApp/Email/SMS), and an Organization
  Login Panel to enable the Collection-Center portal login and pick which
  modules (patients/samples/reports/invoices) that partner can see.
- **Price Lists** (LIMS-side) — reusable pricing sets assigned to
  organizations; "Edit Test Prices" sheet to set per-test overrides; active
  toggle, soft-delete/restore.

## 13. Marketing Staff Module
- **Marketing Staff** — roster of field sales staff (name, employee code,
  mobile, designation, referral-doctor count).
- **Referral Doctors** — doctors referring patients, assignable to a
  marketing-staff member.
- **Targets &amp; Incentives** — monthly revenue/doctor/patient targets per
  staff, plus **Commission Slabs** (percentage tiers).
- **Monthly Report** — month/year picker, stat cards, an achievement-%
  bar chart per staff, a full performance table, a Leaderboard, Export
  Excel.

## 14. Referral Management (a separate system from Marketing Staff)
- **Referrals** — referral sources (Doctor/Hospital/Clinic/Self/Corporate/Other),
  each with its own commission % and an assigned Price List.
- **Referral Settlements** — batches of referral commissions
  (Pending/Paid/Cancelled): Generate Settlement, Mark Paid, Cancel, Export
  Excel/PDF.
- **Referral Dashboard** — revenue trend, referral-type distribution,
  leaderboard.
- **Referral Incentives** — individual incentive line items, filterable by
  source and date.
- **How it works:** every billed patient with a referral source
  automatically generates a `ReferralIncentive`; these get grouped into a
  Settlement later, rather than paid out per-bill.

## 15. Finance
- **Expenses** — an expense ledger (date range, category/service filters,
  "Quick Add" for a category/service/expense on the fly, payment mode),
  Export Excel/PDF.
- **Finance Reports** — revenue reporting grouped By Date / By
  Organisation / By Referral, reading straight off existing Bill/Payment
  data (no separate ledger table of its own).

## 16. Collection Center Portal (the FRANCHISE role's own restricted app)
A cut-down version of the LIMS app for a B2B partner logging in directly,
scoped to only their own data and only the modules their Organization has
enabled: Dashboard, Patient Registration (no center/org picker — it's
implicit), Patient List, Sample Collection (Collect + Print Label only, no
Receive/Approve/Reject), Reports (view/download own), Invoices (view/download own).

---

## How the sample/report pipeline actually works (cross-cutting)

Not a separate screen, but the mechanics behind almost everything above:

- **Order → Sample → Report pipeline:** a booking (Patient Registration
  here, or a patient-app checkout) creates an Appointment. Paying the Bill
  auto-mints a Sample row per (Appointment × SampleType); the sample then
  moves through Pending → Collected → Received → Approved/Rejected →
  Completed while a parallel Report (with a result row per test, and per
  parameter for panel tests) goes through its own PENDING → ... → APPROVED
  → PRINTED lifecycle, independently.
- **Franchise scoping:** almost every list screen a franchise partner can
  see (patients, samples, reports, invoices, price list) is filtered
  server-side to just that Organization's own data — never trusted from a
  client-sent filter.
