import { expect, test } from '@playwright/test'

test.describe('guest theme first paint', () => {
  test('login has no Theme picker and still ships the first paint script', async ({ page }) => {
    // covers: AC-1, AC-5, AC-7
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Theme' })).toHaveCount(0)
    const html = await page.content()
    expect(html).toContain('mentormatch-theme')
  })

  test('register has no Theme picker', async ({ page }) => {
    // covers: AC-1, AC-7
    await page.goto('/register')
    await expect(page.getByRole('button', { name: 'Theme' })).toHaveCount(0)
  })
})
