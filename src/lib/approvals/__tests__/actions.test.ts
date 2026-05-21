import { approveDraft, dismissDraft, editDraft } from '../actions'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
})

function buildUpdateChain(result: { error: null } | { error: { message: string } }) {
  const finalMock = jest.fn().mockResolvedValue(result)
  const firstEqMock = jest.fn().mockReturnValue({ eq: finalMock })
  const updateMock = jest.fn().mockReturnValue({ eq: firstEqMock })
  return { updateMock, firstEqMock, finalMock }
}

describe('approveDraft', () => {
  it('updates draft to approved with sent metadata', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock, firstEqMock } = buildUpdateChain({ error: null })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await approveDraft('draft-1')

    expect(result).toEqual({ success: true })
    expect(mockSupabase.from).toHaveBeenCalledWith('reminders')
    expect(updateMock).toHaveBeenCalledWith({
      approval_status: 'approved',
      sent_at: expect.any(String),
      status: 'sent',
      sent_method: 'deep_link',
    })
    expect(firstEqMock).toHaveBeenCalledWith('id', 'draft-1')
  })

  it('rejects if user not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await approveDraft('draft-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('rejects if user does not own the draft', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Row not found' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await approveDraft('draft-2')

    expect(result).toEqual({ success: false, error: 'Row not found' })
  })

  it('returns error when supabase update fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Database error' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await approveDraft('draft-1')

    expect(result).toEqual({ success: false, error: 'Database error' })
  })
})

describe('dismissDraft', () => {
  it('updates draft to rejected', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock, firstEqMock } = buildUpdateChain({ error: null })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await dismissDraft('draft-1')

    expect(result).toEqual({ success: true })
    expect(mockSupabase.from).toHaveBeenCalledWith('reminders')
    expect(updateMock).toHaveBeenCalledWith({
      approval_status: 'rejected',
      status: 'cancelled',
    })
    expect(firstEqMock).toHaveBeenCalledWith('id', 'draft-1')
  })

  it('rejects if user not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await dismissDraft('draft-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('rejects if user does not own the draft', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Row not found' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await dismissDraft('draft-2')

    expect(result).toEqual({ success: false, error: 'Row not found' })
  })

  it('returns error when supabase update fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Database error' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await dismissDraft('draft-1')

    expect(result).toEqual({ success: false, error: 'Database error' })
  })
})

describe('editDraft', () => {
  it('updates message text and sets user_edited', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock, firstEqMock } = buildUpdateChain({ error: null })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await editDraft('draft-1', 'Custom message text')

    expect(result).toEqual({ success: true })
    expect(mockSupabase.from).toHaveBeenCalledWith('reminders')
    expect(updateMock).toHaveBeenCalledWith({
      message_text: 'Custom message text',
      user_edited: true,
    })
    expect(firstEqMock).toHaveBeenCalledWith('id', 'draft-1')
  })

  it('rejects if user not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await editDraft('draft-1', 'Custom message text')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('rejects if user does not own the draft', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Row not found' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await editDraft('draft-2', 'Custom message text')

    expect(result).toEqual({ success: false, error: 'Row not found' })
  })

  it('returns error when supabase update fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const { updateMock } = buildUpdateChain({ error: { message: 'Database error' } })
    mockSupabase.from.mockReturnValue({ update: updateMock })

    const result = await editDraft('draft-1', 'Custom message text')

    expect(result).toEqual({ success: false, error: 'Database error' })
  })
})
