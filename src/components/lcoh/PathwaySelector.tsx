'use client'

import type { PathwayId } from '@/lib/lcoh/types'
import type { Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

const PATHWAY_GROUPS = [
  {
    id: 'green',
    labelKo: '그린 수소', labelEn: 'Green Hydrogen',
    descKo: '재생에너지 전기분해', descEn: 'Renewable Electrolysis',
    colorClass: 'text-green-700 bg-green-50',
    barColor: 'bg-green-400',
    pathways: ['pem', 'alk', 'aem', 'soec'] as const,
  },
  {
    id: 'blue',
    labelKo: '블루 수소', labelEn: 'Blue Hydrogen',
    descKo: '천연가스 + CCS', descEn: 'Natural Gas + CCS',
    colorClass: 'text-sky-700 bg-sky-50',
    barColor: 'bg-sky-400',
    pathways: ['smr_ccs', 'atr_ccs'] as const,
  },
  {
    id: 'grey',
    labelKo: '그레이 수소', labelEn: 'Grey Hydrogen',
    descKo: '천연가스, CCS 없음', descEn: 'Natural Gas, no CCS',
    colorClass: 'text-gray-600 bg-gray-100',
    barColor: 'bg-gray-400',
    pathways: ['smr'] as const,
  },
  {
    id: 'brown',
    labelKo: '브라운 수소', labelEn: 'Brown Hydrogen',
    descKo: '석탄 가스화', descEn: 'Coal Gasification',
    colorClass: 'text-amber-700 bg-amber-50',
    barColor: 'bg-amber-400',
    pathways: ['coal'] as const,
  },
] as const

const PATHWAY_DESC: Record<string, { ko: string; en: string }> = {
  pem:     { ko: '가장 성숙한 PEM, 빠른 기동', en: 'Mature PEM, fast response' },
  alk:     { ko: '알칼라인, 낮은 CapEx', en: 'Alkaline, lower CapEx' },
  aem:     { ko: '차세대 AEM, R&D 단계', en: 'Next-gen AEM, R&D stage' },
  soec:    { ko: '고온 고효율, 열원 필요', en: 'High-temp, requires heat' },
  smr:     { ko: '현재 주류 방식', en: 'Dominant today' },
  smr_ccs: { ko: 'SMR + CCS 블루', en: 'SMR + CCS Blue' },
  atr_ccs: { ko: 'ATR + CCS, 높은 포집률', en: 'ATR + CCS, high capture' },
  coal:    { ko: '석탄 가스화, 고탄소', en: 'Coal gasif., high CO₂' },
}

function getPathwayLabel(pathwayId: string, lang: Lang, t: Translations): string {
  const id = pathwayId as PathwayId
  return t.pathways[id] ?? pathwayId.toUpperCase()
}

interface Props {
  selected: PathwayId
  onChange: (id: PathwayId) => void
  t: Translations
  lang: Lang
}

export default function PathwaySelector({ selected, onChange, t, lang }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        {lang === 'ko' ? '생산 경로 선택' : 'Select Production Pathway'}
      </h2>
      <div className="space-y-3">
        {PATHWAY_GROUPS.map(group => {
          const isGroupSelected = (group.pathways as readonly string[]).includes(selected)
          return (
            <div key={group.id}>
              {/* 그룹 헤더 */}
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md mb-2 ${group.colorClass}`}>
                <span className={`w-2 h-2 rounded-full ${group.barColor}`} />
                <span className="text-xs font-semibold">
                  {lang === 'ko' ? group.labelKo : group.labelEn}
                </span>
                <span className="text-xs opacity-60">
                  — {lang === 'ko' ? group.descKo : group.descEn}
                </span>
              </div>
              {/* 경로 버튼들 */}
              <div className="flex flex-wrap gap-1.5 pl-2">
                {(group.pathways as readonly string[]).map(pathwayId => (
                  <button
                    key={pathwayId}
                    type="button"
                    onClick={() => onChange(pathwayId as PathwayId)}
                    title={PATHWAY_DESC[pathwayId]?.[lang === 'ko' ? 'ko' : 'en']}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selected === pathwayId
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {getPathwayLabel(pathwayId, lang, t)}
                  </button>
                ))}
              </div>
              {/* 선택된 경로 설명 (선택된 그룹에서만) */}
              {isGroupSelected && (
                <p className="mt-1.5 pl-2 text-xs text-gray-400 italic">
                  {PATHWAY_DESC[selected]?.[lang === 'ko' ? 'ko' : 'en']}
                </p>
              )}
              {/* SOEC 전기+열 합산 경고 */}
              {isGroupSelected && selected === 'soec' && (
                <div className="mt-2 ml-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                  <p className="text-xs text-amber-700">{t.lcoh3.soecHeatNotice}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
