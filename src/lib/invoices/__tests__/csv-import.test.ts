import { parseCsvContent } from '../csv-import'

describe('parseCsvContent', () => {
  it('parses valid CSV with all columns', async () => {
    const csv = 'client_name,amount,due_date,invoice_number,client_phone,client_email\nAcme Corp,50000,2026-06-15,INV-001,+919876543210,billing@acme.com'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].client_name).toBe('Acme Corp')
    expect(rows[0].amount).toBe(50000)
    expect(rows[0].due_date).toBe('2026-06-15')
    expect(rows[0].invoice_number).toBe('INV-001')
    expect(errors).toHaveLength(0)
  })

  it('parses minimal CSV (client_name, amount, due_date only)', async () => {
    const csv = 'client_name,amount,due_date\nAcme Corp,25000,2026-07-01'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].client_name).toBe('Acme Corp')
    expect(rows[0].amount).toBe(25000)
    expect(errors).toHaveLength(0)
  })

  it('rejects rows missing client_name', async () => {
    const csv = 'client_name,amount,due_date\n,50000,2026-06-15'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('client_name')
  })

  it('rejects rows missing amount', async () => {
    const csv = 'client_name,amount,due_date\nAcme Corp,,2026-06-15'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('amount')
  })

  it('rejects rows with invalid amount', async () => {
    const csv = 'client_name,amount,due_date\nAcme Corp,abc,2026-06-15'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid amount')
  })

  it('rejects rows with zero amount', async () => {
    const csv = 'client_name,amount,due_date\nAcme Corp,0,2026-06-15'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
  })

  it('rejects rows missing due_date', async () => {
    const csv = 'client_name,amount,due_date\nAcme Corp,50000,'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('due_date')
  })

  it('handles empty CSV', async () => {
    const csv = 'client_name,amount,due_date\n'
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })

  it('processes multiple rows with mixed valid/invalid', async () => {
    const csv = `client_name,amount,due_date
Acme Corp,50000,2026-06-15
,25000,2026-07-01
Beta Inc,0,2026-08-01
Gamma LLC,100000,2026-09-01`
    const { rows, errors } = await parseCsvContent(csv)
    expect(rows).toHaveLength(2)
    expect(errors).toHaveLength(2)
  })
})
