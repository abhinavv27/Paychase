ALTER TABLE users ADD COLUMN IF NOT EXISTS style_preference VARCHAR(20) NOT NULL DEFAULT 'professional';
ALTER TABLE users ADD CONSTRAINT style_preference_check CHECK (style_preference IN ('casual', 'professional', 'formal'));
