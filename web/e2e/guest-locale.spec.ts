import { expect, test } from '@playwright/test'

test.describe('guest language switch', () => {
  test('home language menu switches Bangla without a reload', async ({ page }) => {
    // covers: AC-2, AC-5, AC-11
    await page.goto('/')
    await page.getByRole('button', { name: 'Language' }).click()
    await page.getByRole('menuitemradio', { name: 'বাংলা' }).click()
    await expect(page.getByRole('button', { name: 'ভাষা' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'লগ ইন' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn-BD')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('Arabic sets rtl and keeps the pick after reload', async ({ page }) => {
    // covers: AC-5, AC-6, AC-7
    await page.goto('/')
    await page.getByRole('button', { name: /Language|ভাষা|اللغة/ }).click()
    await page.getByRole('menuitemradio', { name: 'العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-SA')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('button', { name: 'اللغة' })).toBeVisible()
  })

  test('login still has a language menu in Arabic', async ({ page }) => {
    // covers: AC-1, AC-2
    await page.addInitScript(() => {
      localStorage.setItem('mentormatch-locale', 'ar-SA')
    })
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'مرحباً بعودتك' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'اللغة' })).toBeVisible()
  })

  test('Bangla home copy includes the hero subtitle, not a raw key', async ({ page }) => {
    // covers: AC-8
    await page.addInitScript(() => {
      localStorage.setItem('mentormatch-locale', 'bn-BD')
    })
    await page.goto('/')
    await expect(
      page.getByText('যিনি সেখানে ছিলেন তার নতুন দৃষ্টিভঙ্গি। প্রোফাইল তৈরি করুন এবং সংযোগের জন্য প্রস্তুত হোন।'),
    ).toBeVisible()
    await expect(page.getByText('hero.subtitle')).toHaveCount(0)
  })

  test('callback uses Arabic completing copy when the locale cookie is set', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'mentormatch-locale',
        value: 'ar-SA',
        url: 'https://dpkhbr.slsblx.com',
      },
    ])
    await page.goto('/login/callback')
    await expect(page.getByText('جارٍ إكمال تسجيل الدخول…')).toBeVisible()
    await expect(page.getByText('Completing sign-in…')).toHaveCount(0)
  })

  test('register and activate keep a language menu for a guest', async ({ page }) => {
    // covers: AC-1, AC-2
    await page.goto('/register')
    await expect(page.getByRole('button', { name: 'Language' })).toBeVisible()
    await page.goto('/activate')
    await expect(page.getByRole('button', { name: 'Language' })).toBeVisible()
  })

  test('the language menu is operable with the keyboard', async ({ page }) => {
    // covers: AC-11
    await page.goto('/')
    await page.getByRole('button', { name: 'Language' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'ভাষা' })).toBeVisible()
  })

  test('blocked local storage still loads English and lets the menu work', async ({ page }) => {
    // covers: AC-12
    await page.addInitScript(() => {
      const blocked = {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
        removeItem: () => {
          throw new Error('blocked')
        },
        clear: () => {
          throw new Error('blocked')
        },
        key: () => null,
        length: 0,
      }
      Object.defineProperty(window, 'localStorage', { configurable: true, value: blocked })
    })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await page.getByRole('button', { name: 'Language' }).click()
    await page.getByRole('menuitemradio', { name: 'বাংলা' }).click()
    await expect(page.getByRole('button', { name: 'ভাষা' })).toBeVisible()
  })

  test('home first paint does not warn about a script tag in React', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') messages.push(msg.text())
    })
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Language|ভাষা|اللغة/ })).toBeVisible()
    expect(messages.join('\n')).not.toMatch(/Encountered a script tag while rendering React component/)
  })
})
