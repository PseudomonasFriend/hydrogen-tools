import type { Metadata } from'next'
import type { Lang } from'@/lib/lcoh/types'
import Link from'next/link'
import { ko } from'@/lib/i18n/ko'
import { en } from'@/lib/i18n/en'

const translations = { ko, en }

export async function generateStaticParams() {
  return [{ lang: 'ko' }, { lang: 'en' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const t = translations[(lang as Lang) ?? 'ko'] ?? ko
  return {
    title: t.site.title,
    description: t.site.description,
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const t = translations[(lang as Lang)] ?? ko

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 내비게이션 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href={`/${lang}`} className="text-base font-bold text-blue-700">
              H2Prism
            </Link>
            <Link href={`/${lang}/lcoh`} className="text-sm text-gray-600 hover:text-gray-900">
              {t.nav.lcoh}
            </Link>
            <Link href={`/${lang}/about`} className="text-sm text-gray-600 hover:text-gray-900">
              {t.nav.about}
            </Link>
            <Link href={`/${lang}/privacy`} className="text-sm text-gray-500 hover:text-gray-900">
              {t.nav.privacy}
            </Link>
          </div>
          <Link
            href={t.lang.switchHref}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1 text-gray-600 hover:bg-gray-100"
          >
            {t.lang.switch}
          </Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-blue-700">H2Prism</span>
              <span className="text-xs text-gray-400 ml-2">Hydrogen Economics, Decoded</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link href={`/${lang}/about`} className="hover:text-gray-600">{t.nav.about}</Link>
              <Link href={`/${lang}/privacy`} className="hover:text-gray-600">{t.nav.privacy}</Link>
              <span>&copy; {new Date().getFullYear()} H2Prism</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
