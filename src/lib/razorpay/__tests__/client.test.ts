const mockCreate = jest.fn()
const mockFetch = jest.fn()

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    paymentLink: {
      create: mockCreate,
      fetch: mockFetch,
    },
  }))
})

import { createPaymentLink, fetchPaymentLink } from '../client'

describe('Razorpay client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPaymentLink', () => {
    it('converts amount from rupees to paise (multiplies by 100)', async () => {
      mockCreate.mockResolvedValue({
        id: 'plink_test1',
        short_url: 'https://rzp.io/i/test1',
        status: 'created',
      })

      await createPaymentLink({
        amount: 100,
        currency: 'INR',
        description: 'Test payment',
        customer: { name: 'Test User' },
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
        })
      )
    })

    it('sends correct customer object structure', async () => {
      mockCreate.mockResolvedValue({
        id: 'plink_test2',
        short_url: 'https://rzp.io/i/test2',
        status: 'created',
      })

      await createPaymentLink({
        amount: 500,
        currency: 'INR',
        description: 'Invoice payment',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
        },
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            contact: '9876543210',
          },
        })
      )
    })

    it('passes notes to Razorpay', async () => {
      mockCreate.mockResolvedValue({
        id: 'plink_test3',
        short_url: 'https://rzp.io/i/test3',
        status: 'created',
      })

      const notes = {
        invoice_id: 'inv-123',
        invoice_number: 'INV-001',
        user_id: 'user-456',
      }

      await createPaymentLink({
        amount: 1000,
        currency: 'INR',
        description: 'Test',
        customer: { name: 'Test' },
        notes,
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ notes })
      )
    })

    it('returns id, short_url, and status', async () => {
      mockCreate.mockResolvedValue({
        id: 'plink_test4',
        short_url: 'https://rzp.io/i/test4',
        status: 'created',
      })

      const result = await createPaymentLink({
        amount: 1,
        currency: 'INR',
        description: 'Test',
        customer: { name: 'Test' },
      })

      expect(result).toEqual({
        id: 'plink_test4',
        short_url: 'https://rzp.io/i/test4',
        status: 'created',
      })
    })

    it('throws on API error', async () => {
      mockCreate.mockRejectedValue(new Error('Razorpay API error'))

      await expect(
        createPaymentLink({
          amount: 100,
          currency: 'INR',
          description: 'Test',
          customer: { name: 'Test' },
        })
      ).rejects.toThrow('Razorpay API error')
    })
  })

  describe('fetchPaymentLink', () => {
    it('fetches payment link by id', async () => {
      mockFetch.mockResolvedValue({
        id: 'plink_test5',
        short_url: 'https://rzp.io/i/test5',
        status: 'paid',
        amount: 50000,
        payments: [
          { id: 'pay_1', status: 'captured', amount: 50000 },
        ],
      })

      const result = await fetchPaymentLink('plink_test5')

      expect(mockFetch).toHaveBeenCalledWith('plink_test5')
      expect(result).toEqual({
        id: 'plink_test5',
        short_url: 'https://rzp.io/i/test5',
        status: 'paid',
        amount: 50000,
        payments: [{ id: 'pay_1', status: 'captured', amount: 50000 }],
      })
    })

    it('handles empty payments array', async () => {
      mockFetch.mockResolvedValue({
        id: 'plink_test6',
        short_url: 'https://rzp.io/i/test6',
        status: 'created',
        amount: 10000,
      })

      const result = await fetchPaymentLink('plink_test6')

      expect(result.payments).toEqual([])
    })

    it('throws on API error', async () => {
      mockFetch.mockRejectedValue(new Error('Link not found'))

      await expect(fetchPaymentLink('invalid-id')).rejects.toThrow('Link not found')
    })
  })
})
