ALTER TABLE reminders ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_send_at ON reminders(scheduled_send_at) WHERE scheduled_send_at IS NOT NULL;
