-- Referral Code generation (see src/utils/idGenerator.ts), same atomic
-- nextval() pattern as organization_code_seq/bill_no_seq.
CREATE SEQUENCE IF NOT EXISTS "referral_source_code_seq" START 1;
