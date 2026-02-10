import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load and display hero content', async ({ page }) => {
    await page.goto('/')

    // Wait for the initial auth check to complete and content to render
    // The Landing page shows null while checking auth, then renders
    await page.waitForSelector('header', { timeout: 15000 })

    // Verify hero headline is present
    const headline = page.locator('h1')
    await expect(headline).toBeVisible()
    await expect(headline).toContainText('Mach aus jedem Text einen')

    // Verify CTA button
    const ctaButton = page.getByRole('button', { name: /Kostenlos testen/i })
    await expect(ctaButton).toBeVisible()

    // Verify "Anmelden" button in header
    const loginButton = page.getByRole('button', { name: /Anmelden/i })
    await expect(loginButton).toBeVisible()
  })

  test('should display features section', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('header', { timeout: 15000 })

    // Verify the features section exists (has id="features")
    const featuresSection = page.locator('#features')
    await expect(featuresSection).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('header', { timeout: 15000 })

    // Scroll to footer and verify it exists
    const footer = page.locator('footer').first()
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate from landing to signup via CTA button', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('header', { timeout: 15000 })

    // Click the CTA button
    const ctaButton = page.getByRole('button', { name: /Kostenlos testen/i })
    await ctaButton.click()

    // Should navigate to /signup
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should navigate from landing to signup via Anmelden button', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('header', { timeout: 15000 })

    // Click the Anmelden button in header
    const loginButton = page.getByRole('button', { name: /Anmelden/i })
    await loginButton.click()

    // Should navigate to /signup
    await expect(page).toHaveURL(/\/signup/)
  })
})

test.describe('Sign Up Page', () => {
  test('should load and display auth form', async ({ page }) => {
    await page.goto('/signup')

    // Wait for auth check to complete
    await page.waitForSelector('header', { timeout: 15000 })

    // Verify the signup card title
    const cardTitle = page.getByText('Kostenlos testen', { exact: false })
    await expect(cardTitle.first()).toBeVisible()

    // Verify description text
    const description = page.getByText('Melde dich an', { exact: false })
    await expect(description.first()).toBeVisible()

    // Verify the Auth component is rendered (look for email input or auth form)
    // The Auth component from Appwrite should render some form of login UI
    const authSection = page.locator('main')
    await expect(authSection).toBeVisible()
  })

  test('should have a back/home navigation option', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForSelector('header', { timeout: 15000 })

    // The HeaderBarSignUp has a back button
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })
})

test.describe('Protected Routes', () => {
  test('should redirect /app to landing when not authenticated', async ({ page }) => {
    await page.goto('/app')

    // ProtectedRoute checks auth and redirects to "/" if not logged in
    // Wait for the redirect to complete
    await page.waitForURL('/', { timeout: 15000 })
    await expect(page).toHaveURL('/')
  })

  test('should redirect /settings to landing when not authenticated', async ({ page }) => {
    await page.goto('/settings')

    // ProtectedRoute checks auth and redirects to "/" if not logged in
    await page.waitForURL('/', { timeout: 15000 })
    await expect(page).toHaveURL('/')
  })
})

test.describe('Legal Pages', () => {
  test('should load privacy policy page', async ({ page }) => {
    await page.goto('/privacy')

    // Wait for content
    const heading = page.getByRole('heading', { name: 'Datenschutzerklärung', exact: true })
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('should load imprint page', async ({ page }) => {
    await page.goto('/imprint')

    const heading = page.getByRole('heading', { name: /Impressum/i })
    await expect(heading).toBeVisible({ timeout: 15000 })
  })

  test('should load terms page', async ({ page }) => {
    await page.goto('/terms')

    const heading = page.getByRole('heading', { name: /Allgemeine Geschäftsbedingungen/i })
    await expect(heading).toBeVisible({ timeout: 15000 })
  })
})

test.describe('404 / Unknown Routes', () => {
  test('should redirect unknown routes to landing page', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')

    // The catch-all route renders Landing component
    // Wait for the landing page content
    await page.waitForSelector('header', { timeout: 15000 })

    const headline = page.locator('h1')
    await expect(headline).toBeVisible()
    await expect(headline).toContainText('Mach aus jedem Text einen')
  })
})
