CREATE TABLE custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  escalation_level TEXT NOT NULL CHECK (escalation_level IN ('gentle', 'firm', 'urgent')),
  message_text TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_templates_user_active ON custom_templates(user_id, language, escalation_level) WHERE is_active = TRUE;

ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation_custom_templates ON custom_templates USING (user_id = auth.uid());
