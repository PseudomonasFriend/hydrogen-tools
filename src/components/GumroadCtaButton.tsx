'use client'

import { trackExcelCtaClick } from '@/lib/analytics'

interface Props {
  label: string
  lang: string
  tier?: string
}

export default function GumroadCtaButton({ label, lang, tier = 'all' }: Props) {
  return (
    <a
      href="https://gumroad.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      onClick={() => trackExcelCtaClick(tier, lang)}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label}
    </a>
  )
}
