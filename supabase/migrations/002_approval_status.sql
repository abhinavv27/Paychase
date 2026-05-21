-- Add approval_status column to reminders
ALTER TABLE reminders ADD COLUMN approval_status TEXT DEFAULT 'draft';

-- Add check constraint for valid values
ALTER TABLE reminders ADD CONSTRAINT check_approval_status
  CHECK (approval_status IN ('draft', 'approved', 'rejected', 'sent'));

-- Update existing rows: 'scheduled' → 'draft', everything else → 'sent'
UPDATE reminders SET approval_status = 'draft' WHERE status = 'scheduled';
UPDATE reminders SET approval_status = 'sent' WHERE status != 'scheduled';

-- Add index for fast draft lookup
CREATE INDEX idx_reminders_approval_status ON reminders(approval_status, created_at DESC)
  WHERE approval_status = 'draft';

-- Add index for user's pending approvals
CREATE INDEX idx_reminders_user_approval ON reminders(user_id, approval_status, created_at DESC)
  WHERE approval_status = 'draft';

-- Add sent_from column to track how message was sent (deep_link, copy_paste, api)
ALTER TABLE reminders ADD COLUMN sent_method TEXT;

-- Add user_edited flag to track if user modified the AI draft
ALTER TABLE reminders ADD COLUMN user_edited BOOLEAN DEFAULT FALSE;
