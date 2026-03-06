'use client'

import type { Tier2Result, SensitivityPoint } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import type { useCurrency } from '@/hooks/useCurrency'
import ResultChart from '../ResultChart'
import TornadoChart from '../TornadoChart'
import CurrencySelector from '@/components/CurrencySelector'

// ── CostBadge ──────────────────────────────────────────────────────────────────
function CostBadge({
  label,
  value,
  color,
  convert,
  currencyInfo,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'red' | 'purple'
  convert: (usdValue: number) => number
  currencyInfo: { symbol: string; decimals: number; code: string }
}) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  const displayDecimals = currencyInfo.decimals === 0 ? 0 : 3
  return (
    <div className={`border rounded-lg p-2 text-center ${colorMap[color]}`}>
      <div className="text-xs truncate mb-1">{label}</div>
      <div className="text-sm font-semibold">
        {currencyInfo.symbol}{convert(value).toFixed(displayDecimals)}
      </div>
    </div>
  )
}

interface Props {
  t: Translations
  lang: Lang
  result: Tier2Result | null
  sensitivities: SensitivityPoint[]
  isSmr: boolean
  isStale: boolean
  tier1Compatible: {
    lcoh: number
    annualProduction: number
    capexComponent: number
    opexComponent: number
    fuelComponent: number
  } | null
  currencyCtx: ReturnType<typeof useCurrency>
  resultRef: React.RefObject<HTMLDivElement | null>
}

export default function Tier2ResultPanel({
  t,
  lang,
  result,
  sensitivities,
  isSmr,
  isStale,
  tier1Compatible,
  currencyCtx,
  resultRef,
}: Props) {
  return (
    <>
      {/* ── 우: 결과 패널 (sticky) ─────────────────────────────────── */}
      <div ref={resultRef} className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
        {result ? (
          <div className={`transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.result}</h2>
              </div>
              <div className="mb-4 pb-3 border-b border-gray-100">
                <CurrencySelector {...currencyCtx} />
              </div>

              {/* Tier 1 vs Tier 2 비교 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{t.lcoh2.tier1Compare}</div>
                  <div className="text-3xl font-bold text-gray-600">
                    {currencyCtx.currencyInfo.symbol}
                    {currencyCtx.convert(result.tier1Lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {currencyCtx.currencyInfo.code}/kg H₂
                  </div>
                </div>
                <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 mb-1">{t.lcoh2.tier2Compare}</div>
                  <div className="text-4xl font-bold text-blue-700">
                    {currencyCtx.currencyInfo.symbol}
                    {currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    {currencyCtx.currencyInfo.code}/kg H₂
                  </div>
                </div>
              </div>

              {/* 연간 생산량 */}
              <div className="text-center text-sm text-gray-600 mb-4">
                <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
                {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                {t.lcoh.annualProductionUnit}
              </div>

              {/* 비용 구성 배지 */}
              <div
                className={`grid gap-2 mb-4 ${
                  !isSmr && result.stackReplComponent > 0 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
              >
                <CostBadge
                  label={t.lcoh.capexLabel}
                  value={result.capexComponent}
                  color="blue"
                  convert={currencyCtx.convert}
                  currencyInfo={currencyCtx.currencyInfo}
                />
                <CostBadge
                  label={t.lcoh.opexLabel}
                  value={result.opexComponent}
                  color="amber"
                  convert={currencyCtx.convert}
                  currencyInfo={currencyCtx.currencyInfo}
                />
                <CostBadge
                  label={t.lcoh.fuelLabel}
                  value={result.fuelComponent}
                  color="red"
                  convert={currencyCtx.convert}
                  currencyInfo={currencyCtx.currencyInfo}
                />
                {!isSmr && result.stackReplComponent > 0 && (
                  <CostBadge
                    label={t.lcoh2.stackReplLabel}
                    value={result.stackReplComponent}
                    color="purple"
                    convert={currencyCtx.convert}
                    currencyInfo={currencyCtx.currencyInfo}
                  />
                )}
              </div>

              {/* 비용 구성 차트 */}
              {tier1Compatible && <ResultChart result={tier1Compatible} t={t} />}
            </div>
          </div>
        ) : (
          /* 결과 없을 때 플레이스홀더 (데스크톱만 표시) */
          <div className="hidden lg:flex bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 items-center justify-center min-h-64">
            <p className="text-sm text-gray-400 text-center whitespace-pre-line">
              {lang === 'ko'
                ? '파라미터를 입력하고\n계산 버튼을 누르세요'
                : 'Enter parameters and\nclick Calculate'}
            </p>
          </div>
        )}
      </div>

    </>
  )
}

// ── 민감도 토네이도 차트 (전체 너비, 별도 컴포넌트) ──────────────────────────
export function Tier2SensitivityPanel({
  t,
  lang,
  sensitivities,
  isStale,
}: {
  t: Translations
  lang: Lang
  sensitivities: SensitivityPoint[]
  isStale: boolean
}) {
  if (sensitivities.length === 0) return null
  return (
    <div className={`mt-4 transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600 mb-1">{t.lcoh2.sensitivity}</h2>
        <p className="text-xs text-gray-400 mb-4">{t.lcoh2.sensitivityDesc}</p>
        <TornadoChart sensitivities={sensitivities} t={t} lang={lang} />
      </div>
    </div>
  )
}
