import { chromium } from 'playwright'

const BASE = 'https://dpkhbr.slsblx.com'
const shots = '/tmp/claude-1000/-home-noor-Desktop-AdpList-adplist-clone/f3632b5e-bc3b-48a5-b336-04213c2f201a/scratchpad/verify'
const log = (name, val, extra = '') => console.log((val === true ? 'PASS' : val === false ? 'FAIL' : String(val)).padEnd(6), name, extra)

const run = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /continue with blocks/i }).click()
  await page.waitForURL((url) => !url.hostname.includes('dpkhbr'), { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.locator('input[type="email"], input[name="email"], input[name="username"]').first().fill('mentor1@yopmail.com')
  await page.locator('input[type="password"]').first().fill('Pass@123')
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click()
  await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(800)

  // switch to English for stable selectors
  await page.locator('button[aria-haspopup="menu"]').first().click()
  await page.waitForTimeout(300)
  await page.getByRole('menuitemradio', { name: /^English$/ }).click()
  await page.waitForTimeout(700)

  // 1. Route-change auto-close: open drawer, click "Profile" (a different route)
  await page.setViewportSize({ width: 400, height: 900 })
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('button.md\\:hidden[aria-expanded]').first().click()
  await page.waitForTimeout(350)
  const drawer = page.locator('[role="dialog"][aria-modal="true"]')
  log('drawer open before nav click', (await drawer.getAttribute('aria-hidden')) === 'false')
  await page.locator('[role="dialog"] nav a', { hasText: 'Profile' }).click()
  await page.waitForTimeout(600)
  log('navigated to /settings/profile', page.url().includes('/settings/profile'), page.url())
  log('drawer auto-closed after route change', (await drawer.getAttribute('aria-hidden')) === 'true')

  // 2. Viewport-grow auto-close
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.setViewportSize({ width: 400, height: 900 })
  await page.waitForTimeout(400)
  await page.locator('button.md\\:hidden[aria-expanded]').first().click()
  await page.waitForTimeout(350)
  log('drawer open before resize', (await drawer.getAttribute('aria-hidden')) === 'false')
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.waitForTimeout(500)
  log('drawer auto-closed after viewport grows past md', (await drawer.getAttribute('aria-hidden')) === 'true')

  await browser.close()
}

run().catch((e) => {
  console.error('ERROR', e.message)
  process.exit(1)
})
