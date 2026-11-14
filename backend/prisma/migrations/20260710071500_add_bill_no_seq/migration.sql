-- Bill No. generation (see src/utils/idGenerator.ts), same atomic nextval()
-- pattern as patient_id_seq/appointment_no_seq.
CREATE SEQUENCE IF NOT EXISTS "bill_no_seq" START 1;
