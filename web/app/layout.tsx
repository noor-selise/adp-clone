import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, Noto_Sans_Bengali, Noto_Sans_Arabic } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import { LocalizationProvider } from '@/components/providers/localization-provider'
import { BlockingScript } from '@/components/blocking-script'
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme/theme'
import {
  LOCALE_BOOTSTRAP_SCRIPT,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseLocale,
  resolveDirection,
} from '@/lib/i18n/locale'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const notoSansBengali = Noto_Sans_Bengali({
  variable: '--font-noto-bengali',
  subsets: ['bengali'],
})

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-noto-arabic',
  subsets: ['arabic'],
})

export const metadata: Metadata = {
  title: 'MentorMatch — Find your next step with a mentor',
  description: 'ADPList-style mentorship marketplace on SELISE Blocks',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = parseLocale((await cookies()).get(LOCALE_STORAGE_KEY)?.value) ?? DEFAULT_LOCALE

  return (
    <html
      lang={locale}
      dir={resolveDirection(locale)}
      className={`${inter.variable} ${notoSansBengali.variable} ${notoSansArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <BlockingScript id="mentormatch-theme-boot" html={THEME_BOOTSTRAP_SCRIPT} />
        <BlockingScript id="mentormatch-locale-boot" html={LOCALE_BOOTSTRAP_SCRIPT} />
        <AuthProvider>
          <LocalizationProvider initialLocale={locale}>{children}</LocalizationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
