-- Migration 003: Critical fixes from 6-dimension audit
-- Fixes: FLOAT→NUMERIC, RLS WITH CHECK, payment trigger, missing indexes

-- 1. Fix FLOAT → NUMERIC(15,2) for all monetary columns
ALTER TABLE clients
  ALTER COLUMN total_paid TYPE NUMERIC(15,2),
  ALTER COLUMN total_outstanding TYPE NUMERIC(15,2);

ALTER TABLE invoices
  ALTER COLUMN amount TYPE NUMERIC(15,2),
  ALTER COLUMN paid_amount TYPE NUMERIC(15,2);

ALTER TABLE payments
  ALTER COLUMN amount TYPE NUMERIC(15,2);

-- 2. Fix RLS policies: add WITH CHECK clauses for INSERT/UPDATE
DROP POLICY IF EXISTS user_isolation_clients ON clients;
CREATE POLICY user_isolation_clients ON clients
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_invoices ON invoices;
CREATE POLICY user_isolation_invoices ON invoices
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_reminders ON reminders;
CREATE POLICY user_isolation_reminders ON reminders
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_payments ON payments;
CREATE POLICY user_isolation_payments ON payments
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_ai_predictions ON ai_predictions;
CREATE POLICY user_isolation_ai_predictions ON ai_predictions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_consent_log ON consent_log;
CREATE POLICY user_isolation_consent_log ON consent_log
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_isolation_audit_log ON audit_log;
CREATE POLICY user_isolation_audit_log ON audit_log
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Fix payment trigger: move from invoices to payments table
DROP TRIGGER IF EXISTS trg_check_payment_amount ON invoices;
DROP FUNCTION IF EXISTS check_payment_amount();

CREATE OR REPLACE FUNCTION check_payment_amount_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  invoice_amount NUMERIC(15,2);
BEGIN
  SELECT amount INTO invoice_amount
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF invoice_amount IS NOT NULL AND NEW.amount > invoice_amount THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds invoice amount (%)', NEW.amount, invoice_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_payment_amount_on_insert
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_amount_on_insert();

-- 4. Add missing indexes for cron query patterns
-- NOTE: idx_invoices_overdue removed — NOW() is STABLE not IMMUTABLE, can't use in partial index predicate

CREATE INDEX idx_reminders_notification_cooldown ON reminders(user_id, channel, created_at)
  WHERE channel = 'notification';

CREATE INDEX idx_invoices_client_latest ON invoices(client_id, due_date DESC);

CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

CREATE INDEX idx_users_plan ON users(plan) WHERE plan = 'paused';

CREATE INDEX idx_reminders_whatsapp_msg ON reminders(whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
