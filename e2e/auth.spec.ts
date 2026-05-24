import { test, expect } from '@playwright/test'

test.describe('Authentication pages', () => {
  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('h1')).toContainText('Sign in')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login page has link to signup', async ({ page }) => {
    await page.goto('/login')

    const signupLink = page.getByRole('link', { name: /sign up/i })
    await expect(signupLink).toBeVisible()
    await expect(signupLink).toHaveAttribute('href', '/signup')
  })

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login')

    const forgotLink = page.getByRole('link', { name: /forgot password/i })
    await expect(forgotLink).toBeVisible()
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password')
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('h1')).toContainText('Create account')
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.locator('h1')).toContainText('Reset password')
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })
})

test.describe('Authentication redirects', () => {
  test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/invoices', { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/login')
  })

  test('clients page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/clients', { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/login')
  })

  test('analytics page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/login')
  })
})
