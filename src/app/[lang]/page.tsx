import type { Lang } from '@/lib/lcoh/types'
import Link from 'next/link'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'

const translations = { ko, en }

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = translations[(lang as Lang)] ?? ko

  return (
    <div className="space-y-8">
      {/* 히어로 */}
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.home.hero}</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">{t.home.subtitle}</p>
        <Link
          href={`/${lang}/lcoh`}
          className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {t.home.goToCalculator}
        </Link>
      </div>

      {/* 티어 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={`/${lang}/lcoh`} className="block bg-white rounded-xl border border-blue-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-blue-600 text-lg font-bold mb-2">{t.home.tier1Title}</div>
          <p className="text-sm text-gray-600">{t.home.tier1Desc}</p>
        </Link>
        <Link href={`/${lang}/lcoh/tier2`} className="block bg-white rounded-xl border border-blue-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-blue-600 text-lg font-bold mb-2">{t.home.tier2Title}</div>
          <p className="text-sm text-gray-600">{t.home.tier2Desc}</p>
        </Link>
        <Link href={`/${lang}/lcoh/tier3`} className="block bg-white rounded-xl border border-blue-200 p-5 hover:shadow-md transition-shadow">
          <div className="text-blue-600 text-lg font-bold mb-2">{t.home.tier3Title}</div>
          <p className="text-sm text-gray-600">{t.home.tier3Desc}</p>
        </Link>
      </div>

      {/* Excel 모델 CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.home.getExcelModels}</h2>
        <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">{t.home.excelModelDesc}</p>
        <a
          href="https://gumroad.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t.home.getExcelModels}
        </a>
        <p className="text-xs text-gray-400 mt-3">Tier 1 (Free) / Tier 2 ($24) / Tier 3 ($59)</p>
      </div>
    </div>
  )
}
