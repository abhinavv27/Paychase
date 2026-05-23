ALTER TABLE invoices ADD CONSTRAINT unique_user_invoice_number UNIQUE (user_id, invoice_number);
