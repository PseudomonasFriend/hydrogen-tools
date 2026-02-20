import type { Lang } from '@/lib/lcoh/types'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'
import TierTabs from '@/components/lcoh/TierTabs'

const translations = { ko, en }

export default async function LcohLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const t = translations[lang as Lang] ?? ko

  return (
    <div>
      <TierTabs lang={lang} t={t} />
      {children}
    </div>
  )
}
