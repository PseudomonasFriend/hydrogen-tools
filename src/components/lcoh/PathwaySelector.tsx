'use client'

import type { PathwayId } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { PATHWAY_ORDER } from '@/lib/lcoh/pathways'

const COLOR_STYLES: Record<string, string> = {
  green: 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100',
  blue: 'border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100',
  gray: 'border-gray-400 bg-gray-50 text-gray-800 hover:bg-gray-100',
  yellow: 'border-yellow-600 bg-yellow-50 text-yellow-800 hover:bg-yellow-100',
}

const ACTIVE_COLOR_STYLES: Record<string, string> = {
  green: 'border-green-600 bg-green-200 text-green-900 font-semibold',
  blue: 'border-blue-600 bg-blue-200 text-blue-900 font-semibold',
  gray: 'border-gray-600 bg-gray-200 text-gray-900 font-semibold',
  yellow: 'border-yellow-700 bg-yellow-200 text-yellow-900 font-semibold',
}

const PATHWAY_COLORS: Record<PathwayId, string> = {
  pem: 'green',
  alk: 'green',
  aem: 'green',
  soec: 'green',
  smr: 'gray',
  smr_ccs: 'blue',
  atr_ccs: 'blue',
  coal: 'yellow',
}

interface Props {
  selected: PathwayId
  onChange: (id: PathwayId) => void
  t: Translations
}

export default function PathwaySelector({ selected, onChange, t }: Props) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-600 mb-3">{t.lcoh.pathway}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PATHWAY_ORDER.map((id) => {
          const color = PATHWAY_COLORS[id]
          const isActive = selected === id
          const baseStyle = 'border-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all'
          const colorStyle = isActive ? ACTIVE_COLOR_STYLES[color] : COLOR_STYLES[color]
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`${baseStyle} ${colorStyle}`}
            >
              {t.pathways[id]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
