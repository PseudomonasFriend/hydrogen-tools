'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  lang: string
  t: Translations
}

export default function TierTabs({ lang, t }: Props) {
  const pathname = usePathname()
  const isTier2 = pathname.endsWith('/tier2')
  const isTier3 = pathname.endsWith('/tier3')
  const isTier1 = !isTier2 && !isTier3

  const activeClass = 'border border-b-white border-gray-200 bg-white text-blue-600 -mb-px'
  const inactiveClass = 'text-gray-500 hover:text-gray-700 border border-transparent'

  return (
    <div className="flex gap-1 mb-6 border-b border-gray-200">
      <Link
        href={`/${lang}/lcoh`}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${isTier1 ? activeClass : inactiveClass}`}
      >
        {t.lcoh2.tier1Tab}
      </Link>
      <Link
        href={`/${lang}/lcoh/tier2`}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${isTier2 ? activeClass : inactiveClass}`}
      >
        {t.lcoh2.tier2Tab}
      </Link>
      <Link
        href={`/${lang}/lcoh/tier3`}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${isTier3 ? activeClass : inactiveClass}`}
      >
        {t.lcoh2.tier3Tab}
      </Link>
    </div>
  )
}
