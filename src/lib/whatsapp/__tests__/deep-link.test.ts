import { generateWhatsAppLink, formatPhoneForWhatsApp, copyToClipboard, generateWhatsAppBusinessLink, isMobileDevice } from '../deep-link'

describe('generateWhatsAppLink', () => {
  it('generates a basic wa.me link with phone and message', () => {
    const link = generateWhatsAppLink({
      phone: '919876543210',
      message: 'Hello, this is a reminder for your invoice.',
    })

    expect(link).toBe(
      'https://wa.me/919876543210?text=Hello%2C%20this%20is%20a%20reminder%20for%20your%20invoice.'
    )
  })

  it('normalizes phone numbers by removing spaces', () => {
    const link = generateWhatsAppLink({
      phone: '91 98765 43210',
      message: 'Test message',
    })

    expect(link).toBe('https://wa.me/919876543210?text=Test%20message')
  })

  it('normalizes phone numbers by removing dashes', () => {
    const link = generateWhatsAppLink({
      phone: '91-98765-43210',
      message: 'Test message',
    })

    expect(link).toBe('https://wa.me/919876543210?text=Test%20message')
  })

  it('normalizes phone numbers by removing parentheses', () => {
    const link = generateWhatsAppLink({
      phone: '(91) 98765-43210',
      message: 'Test message',
    })

    expect(link).toBe('https://wa.me/919876543210?text=Test%20message')
  })

  it('removes leading + from phone numbers', () => {
    const link = generateWhatsAppLink({
      phone: '+919876543210',
      message: 'Test message',
    })

    expect(link).toBe('https://wa.me/919876543210?text=Test%20message')
  })

  it('URL-encodes special characters in messages', () => {
    const link = generateWhatsAppLink({
      phone: '919876543210',
      message: 'Invoice #123: ₹5,000 (10% discount) & more!',
    })

    expect(link).toContain('Invoice%20%23123')
    expect(link).toContain('%E2%82%B95%2C000')
    expect(link).toContain('(10%25%20discount)')
    expect(link).toContain('%26%20more!')
  })

  it('handles empty phone number', () => {
    const link = generateWhatsAppLink({
      phone: '',
      message: 'Test message',
    })

    expect(link).toBe('https://wa.me/?text=Test%20message')
  })

  it('handles long messages (500+ chars)', () => {
    const longMessage = 'A'.repeat(600)
    const link = generateWhatsAppLink({
      phone: '919876543210',
      message: longMessage,
    })

    expect(link).toBe(`https://wa.me/919876543210?text=${encodeURIComponent(longMessage)}`)
    expect(link.length).toBeGreaterThan(600)
  })
})

describe('generateWhatsAppBusinessLink', () => {
  it('generates a link using the provided business phone number', () => {
    const link = generateWhatsAppBusinessLink({
      phone: '911234567890',
      message: 'Business message',
      businessPhone: '919876543210',
    })

    expect(link).toBe('https://wa.me/919876543210?text=Business%20message')
  })
})

describe('isMobileDevice', () => {
  it('returns false when navigator is undefined (SSR)', () => {
    const nav = global.navigator
    // @ts-expect-error - Deleting navigator to simulate SSR
    delete global.navigator
    expect(isMobileDevice()).toBe(false)
    global.navigator = nav
  })

  it('returns false for desktop user agent', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      configurable: true,
    })
    expect(isMobileDevice()).toBe(false)
  })

  it('returns true for Android user agent', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0',
      configurable: true,
    })
    expect(isMobileDevice()).toBe(true)
  })

  it('returns true for iPhone user agent', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
      configurable: true,
    })
    expect(isMobileDevice()).toBe(true)
  })
})

describe('formatPhoneForWhatsApp', () => {
  it('adds 91 prefix to 10-digit Indian numbers', () => {
    expect(formatPhoneForWhatsApp('9876543210')).toBe('919876543210')
  })

  it('normalizes 11-digit numbers starting with 0', () => {
    expect(formatPhoneForWhatsApp('09876543210')).toBe('919876543210')
  })

  it('keeps 12-digit numbers starting with 91 as-is', () => {
    expect(formatPhoneForWhatsApp('919876543210')).toBe('919876543210')
  })

  it('removes non-digit characters before processing', () => {
    expect(formatPhoneForWhatsApp('98765-43210')).toBe('919876543210')
    expect(formatPhoneForWhatsApp('98 765 43210')).toBe('919876543210')
  })

  it('returns cleaned number for unrecognizable formats', () => {
    expect(formatPhoneForWhatsApp('1234567890123')).toBe('1234567890123')
  })

  it('handles empty string', () => {
    expect(formatPhoneForWhatsApp('')).toBe('')
  })
})

describe('copyToClipboard', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    global.navigator = originalNavigator
    jest.restoreAllMocks()
  })

  it('calls navigator.clipboard.writeText when available', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    global.navigator = {
      clipboard: {
        writeText: mockWriteText,
      },
    } as unknown as Navigator

    const result = await copyToClipboard('Test message')

    expect(result).toBe(true)
    expect(mockWriteText).toHaveBeenCalledWith('Test message')
  })

  it('returns false when navigator is undefined', async () => {
    const navigatorBackup = global.navigator
    // @ts-expect-error - Deleting navigator to simulate SSR
    delete global.navigator

    const result = await copyToClipboard('Test message')
    expect(result).toBe(false)

    global.navigator = navigatorBackup
  })

  it('returns false when clipboard is undefined', async () => {
    global.navigator = {} as Navigator

    const result = await copyToClipboard('Test message')
    expect(result).toBe(false)
  })
})
