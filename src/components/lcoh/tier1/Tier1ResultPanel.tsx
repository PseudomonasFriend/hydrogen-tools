'use client'

import type { Tier1Result, ElectrolyzerParams, SmrParams } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import type { useCurrency } from '@/hooks/useCurrency'
import ResultChart from '../ResultChart'
import CurrencySelector from '@/components/CurrencySelector'

// ── CostBadge ────────────────────────────────────────────────────────────────
function CostBadge({
  label,
  value,
  color,
  convert,
  currencyInfo,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'red'
  convert: (usdValue: number) => number
  currencyInfo: { symbol: string; decimals: number }
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  // 구성 항목은 소수점 3자리(USD) 또는 통화별 소수점에 맞춤
  const displayDecimals = currencyInfo.decimals === 0 ? 0 : 3
  return (
    <div className={`border rounded-lg p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-base font-bold sm:text-lg">
          {currencyInfo.symbol}{convert(value).toFixed(displayDecimals)}
          <span className="text-xs font-normal ml-0.5">/kg</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  t: Translations
  lang: Lang
  result: Tier1Result | null
  isSmr: boolean
  params: ElectrolyzerParams | SmrParams
  currencyCtx: ReturnType<typeof useCurrency>
  resultRef: React.RefObject<HTMLDivElement | null>
}

export default function Tier1ResultPanel({
  t,
  lang,
  result,
  isSmr,
  params,
  currencyCtx,
  resultRef,
}: Props) {
  if (!result) {
    return (
      <div className="hidden lg:flex bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 items-center justify-center">
        <p className="text-sm text-gray-400 text-center whitespace-pre-line">
          {lang === 'ko' ? '파라미터를 입력하고\n계산 버튼을 누르세요' : 'Enter parameters and\nclick Calculate'}
        </p>
      </div>
    )
  }

  return (
    <div ref={resultRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.result}</h2>
      </div>
      <div className="mb-4 pb-3 border-b border-gray-100">
        <CurrencySelector {...currencyCtx} />
      </div>

      {/* LCOH 메인 숫자 */}
      <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
        <div className="text-sm text-blue-600 mb-1">{t.lcoh.lcohResult}</div>
        <div className="text-4xl font-bold text-blue-700">
          {currencyCtx.currencyInfo.symbol}{currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
        </div>
        <div className="text-sm text-blue-500 mt-1">{currencyCtx.currencyInfo.code}/kg H₂</div>
      </div>

      {/* 총 투자비 (전해조 경로만) */}
      {!isSmr && (() => {
        const elecParams = params as ElectrolyzerParams
        const totalCapexUsd = elecParams.systemCapacity * elecParams.capex
        return (
          <div className="mt-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-1">
              {lang === 'ko' ? '총 설비 투자비 (Total CapEx)' : 'Total Capital Cost'}
            </div>
            <div className="text-lg font-bold text-slate-700">
              {currencyCtx.currencyInfo.symbol}{(currencyCtx.convert(totalCapexUsd) / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-xs text-slate-400">
              {elecParams.systemCapacity.toLocaleString()} kW × {currencyCtx.currencyInfo.symbol}{currencyCtx.convert(elecParams.capex).toFixed(0)}/kW
            </div>
          </div>
        )
      })()}

      {/* 연간 생산량 */}
      <div className="text-center text-sm text-gray-600 mb-4 mt-3">
        <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
        {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })} {t.lcoh.annualProductionUnit}
      </div>

      {/* 비용 구성 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <CostBadge label={t.lcoh.capexLabel} value={result.capexComponent} color="blue" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
        <CostBadge label={t.lcoh.opexLabel} value={result.opexComponent} color="amber" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
        <CostBadge label={t.lcoh.fuelLabel} value={result.fuelComponent} color="red" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
      </div>

      {/* 차트 */}
      <ResultChart result={result} t={t} />

      {/* 데이터 출처 */}
      <p className="mt-3 text-xs text-gray-400 text-right">
        {lang === 'ko'
          ? '기본값 출처: IEA Global Hydrogen Review 2024 · IRENA 2024'
          : 'Default values: IEA Global Hydrogen Review 2024 · IRENA 2024'}
      </p>
    </div>
  )
}
