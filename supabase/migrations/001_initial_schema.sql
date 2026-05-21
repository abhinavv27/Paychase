-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  industry TEXT,
  avg_payment_delay_days FLOAT DEFAULT 0,
  on_time_rate FLOAT DEFAULT 0,
  total_invoices INT DEFAULT 0,
  total_paid FLOAT DEFAULT 0,
  total_outstanding FLOAT DEFAULT 0,
  risk_score FLOAT DEFAULT 0.5,
  preferred_language TEXT DEFAULT 'en',
  preferred_channel TEXT DEFAULT 'whatsapp',
  optimal_send_hour INT DEFAULT 10,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  invoice_number TEXT NOT NULL,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'INR',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_amount FLOAT DEFAULT 0,
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  upi_link TEXT,
  reminder_count INT DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  channel TEXT NOT NULL,
  template_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  whatsapp_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT NOT NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  status TEXT DEFAULT 'captured',
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Predictions
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  predicted_payment_date DATE,
  predicted_late_probability FLOAT,
  confidence_interval_low DATE,
  confidence_interval_high DATE,
  model_version TEXT DEFAULT 'v1',
  features_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DPDP Consent Log
CREATE TABLE consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  consent_type TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_reminders_user_status ON reminders(user_id, status);
CREATE INDEX idx_reminders_scheduled ON reminders(status, sent_at) WHERE status = 'scheduled';
CREATE INDEX idx_reminders_invoice ON reminders(invoice_id);
CREATE INDEX idx_clients_user_risk ON clients(user_id, risk_score DESC);
CREATE INDEX idx_clients_user_phone ON clients(user_id, phone);
CREATE UNIQUE INDEX idx_payments_razorpay_id ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_ai_predictions_invoice ON ai_predictions(invoice_id, created_at DESC);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation_users ON users USING (id = auth.uid());
CREATE POLICY user_isolation_clients ON clients USING (user_id = auth.uid());
CREATE POLICY user_isolation_invoices ON invoices USING (user_id = auth.uid());
CREATE POLICY user_isolation_reminders ON reminders USING (user_id = auth.uid());
CREATE POLICY user_isolation_payments ON payments USING (user_id = auth.uid());
CREATE POLICY user_isolation_ai_predictions ON ai_predictions USING (user_id = auth.uid());
CREATE POLICY user_isolation_consent_log ON consent_log USING (user_id = auth.uid());
CREATE POLICY user_isolation_audit_log ON audit_log USING (user_id = auth.uid());

-- Payment amount check trigger
CREATE OR REPLACE FUNCTION check_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount > (SELECT amount FROM invoices WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Payment amount exceeds invoice amount';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_payment_amount
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_amount();
