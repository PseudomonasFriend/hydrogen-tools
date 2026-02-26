import type { Lang } from '@/lib/lcoh/types'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'
import Tier3Calculator from '@/components/lcoh/Tier3Calculator'

const translations = { ko, en }

export default async function Tier3Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = translations[lang as Lang] ?? ko

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.lcoh3.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.lcoh3.subtitle}</p>
      </div>
      <Tier3Calculator t={t} lang={lang as Lang} />
    </div>
  )
}
