-- Sequences backing human-readable, gap-free order/ticket numbers for the
-- Patient App module (see src/utils/idGenerator.ts), same convention as
-- patient_id_seq/appointment_no_seq from the Patient/Appointment module.
CREATE SEQUENCE IF NOT EXISTS "app_order_no_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "app_ticket_no_seq" START 1;
