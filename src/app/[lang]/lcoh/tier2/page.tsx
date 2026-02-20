import type { Lang } from '@/lib/lcoh/types'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'
import Tier2Calculator from '@/components/lcoh/Tier2Calculator'

const translations = { ko, en }

export default async function Tier2Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = translations[lang as Lang] ?? ko

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.lcoh2.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.lcoh2.subtitle}</p>
      </div>
      <Tier2Calculator t={t} />
    </div>
  )
}
