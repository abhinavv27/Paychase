import { validateCsvContent } from '../import'

const TEST_USER_ID = 'test-user-123'

describe('validateCsvContent', () => {
  describe('valid CSV with clients and invoices', () => {
    it('parses valid CSV correctly', () => {
      const csv = `name,phone,email,industry,invoice_number,amount,issue_date,due_date
Acme Corp,+919876543210,billing@acme.com,Technology,INV-001,15000,2026-05-01,2026-05-31
Globex Inc,+919876543211,finance@globex.com,Manufacturing,INV-002,25000,2026-05-05,2026-06-04`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.clients).toHaveLength(2)
      expect(result.invoices).toHaveLength(2)
      expect(result.errors).toHaveLength(0)

      expect(result.clients[0]).toMatchObject({
        user_id: TEST_USER_ID,
        name: 'Acme Corp',
        phone: '+919876543210',
        email: 'billing@acme.com',
        industry: 'Technology',
      })

      expect(result.invoices[0]).toMatchObject({
        user_id: TEST_USER_ID,
        invoice_number: 'INV-001',
        amount: 15000,
        currency: 'INR',
        issue_date: '2026-05-01',
        due_date: '2026-05-31',
        status: 'pending',
      })
    })

    it('deduplicates clients by name', () => {
      const csv = `name,phone,email,industry,invoice_number,amount,issue_date,due_date
Acme Corp,+919876543210,billing@acme.com,Technology,INV-001,15000,2026-05-01,2026-05-31
Acme Corp,+919876543210,billing@acme.com,Technology,INV-002,25000,2026-05-05,2026-06-04`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.clients).toHaveLength(1)
      expect(result.invoices).toHaveLength(2)
    })

    it('handles case-insensitive client deduplication', () => {
      const csv = `name,invoice_number,amount
Acme Corp,INV-001,15000
acme corp,INV-002,25000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.clients).toHaveLength(1)
      expect(result.invoices).toHaveLength(2)
    })
  })

  describe('CSV with missing names', () => {
    it('reports error for missing client name', () => {
      const csv = `name,phone,email,invoice_number,amount
,+919876543210,test@example.com,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'name',
        message: 'Client name is required',
      })
    })

    it('skips rows with missing names but continues processing', () => {
      const csv = `name,invoice_number,amount
,INV-001,15000
Valid Client,INV-002,25000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.clients).toHaveLength(1)
      expect(result.clients[0].name).toBe('Valid Client')
    })
  })

  describe('CSV with invalid emails', () => {
    it('reports error for invalid email format', () => {
      const csv = `name,email,invoice_number,amount
Test Client,invalid-email,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'email',
        message: 'Invalid email format',
      })
    })

    it('allows valid email formats', () => {
      const csv = `name,email,invoice_number,amount
Test Client,valid@example.com,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('allows missing email', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('CSV with invalid amounts', () => {
    it('reports error for non-numeric amount', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,abc`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'amount',
        message: 'Invalid amount',
      })
    })

    it('reports error for negative amount', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,-100`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('reports error for zero amount', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,0`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('allows valid positive amounts', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,100.50`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.invoices).toHaveLength(1)
      expect(result.invoices[0].amount).toBe(100.5)
    })
  })

  describe('empty CSV', () => {
    it('handles CSV with only headers', () => {
      const csv = `name,phone,email,invoice_number,amount`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.clients).toHaveLength(0)
      expect(result.invoices).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('handles empty string', () => {
      const result = validateCsvContent('', TEST_USER_ID)

      expect(result.valid).toBe(true)
      expect(result.clients).toHaveLength(0)
      expect(result.invoices).toHaveLength(0)
    })
  })

  describe('invalid CSV format', () => {
    it('handles malformed CSV', () => {
      const csv = `"unclosed quote,name,amount
"Test",100`

      const result = validateCsvContent(csv, TEST_USER_ID)

      // csv-parse may or may not throw depending on the malformed input
      // If it doesn't throw, it should still parse what it can
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('clients')
      expect(result).toHaveProperty('invoices')
    })
  })

  describe('phone validation', () => {
    it('warns for potentially invalid phone numbers', () => {
      const csv = `name,phone,invoice_number,amount
Test Client,123,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toMatchObject({
        row: 2,
        field: 'phone',
        message: 'Phone number may be invalid',
      })
      // Warnings don't block import
      expect(result.valid).toBe(true)
    })

    it('accepts valid phone numbers', () => {
      const csv = `name,phone,invoice_number,amount
Test Client,+919876543210,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.warnings).toHaveLength(0)
      expect(result.valid).toBe(true)
    })
  })

  describe('row numbers', () => {
    it('reports correct row numbers (2-indexed)', () => {
      const csv = `name,email,invoice_number,amount
Client A,invalid,INV-001,100
Client B,also-invalid,INV-002,200`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].row).toBe(2)
      expect(result.errors[1].row).toBe(3)
    })
  })

  describe('defaults', () => {
    it('sets default dates when not provided', () => {
      const csv = `name,invoice_number,amount
Test Client,INV-001,15000`

      const result = validateCsvContent(csv, TEST_USER_ID)

      expect(result.invoices).toHaveLength(1)
      const invoice = result.invoices[0]
      expect(invoice.issue_date).toBeDefined()
      expect(invoice.due_date).toBeDefined()
      // Due date should be ~30 days after issue date
      const issueDate = new Date(invoice.issue_date)
      const dueDate = new Date(invoice.due_date)
      const diffDays = Math.round((dueDate.getTime() - issueDate.getTime()) / (24 * 60 * 60 * 1000))
      expect(diffDays).toBe(30)
    })
  })
})
