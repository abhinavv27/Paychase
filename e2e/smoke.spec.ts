import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('root redirects to login', async ({ page }) => {
    await page.goto('/')
    expect(page.url()).toContain('/login')
  })

  test('login page returns 200', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.ok()).toBe(true)
  })

  test('signup page returns 200', async ({ page }) => {
    const response = await page.goto('/signup')
    expect(response?.ok()).toBe(true)
  })

  test('forgot password page returns 200', async ({ page }) => {
    const response = await page.goto('/forgot-password')
    expect(response?.ok()).toBe(true)
  })

  test('reset password page returns 200', async ({ page }) => {
    const response = await page.goto('/reset-password')
    expect(response?.ok()).toBe(true)
  })
})

test.describe('Page metadata', () => {
  test('login page has correct title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/PayChase/)
  })
})
