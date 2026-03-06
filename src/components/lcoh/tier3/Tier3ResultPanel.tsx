'use client'

import type { Tier3Result, BreakEvenResult, Tier2ExtraParams, Tier3ExtraParams } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import type { useCurrency } from '@/hooks/useCurrency'
import NpvChart from '../NpvChart'
import CurrencySelector from '@/components/CurrencySelector'

// 시나리오 가정 텍스트 (계산 로직에 고정된 값 반영)
const SCENARIO_ASSUMPTIONS: Record<string, { ko: string; en: string }> = {
  optimistic:   { ko: 'CapEx -15%, 판매가 +15%', en: 'CapEx -15%, Price +15%' },
  base:         { ko: '기준 시나리오 (기본값 적용)', en: 'Base scenario (default values)' },
  conservative: { ko: 'CapEx +15%, 판매가 -15%', en: 'CapEx +15%, Price -15%' },
}

// ── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  positive,
  subLabel,
  subValue,
}: {
  label: string
  value: string
  positive: boolean
  subLabel?: string
  subValue?: string
}) {
  return (
    <div className={`border rounded-lg p-3 text-center ${positive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive ? 'text-green-700' : 'text-red-600'}`}>{value}</div>
      {subLabel && (
        <div className={`text-xs mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>{subLabel}</div>
      )}
      {subValue && (
        <div className={`text-xs font-medium ${positive ? 'text-green-700' : 'text-red-600'}`}>{subValue}</div>
      )}
    </div>
  )
}

interface Props {
  t: Translations
  lang: Lang
  result: Tier3Result | null
  breakEvenResult: BreakEvenResult | null
  isStale: boolean
  t2Params: Tier2ExtraParams
  t3Params: Tier3ExtraParams
  currencyCtx: ReturnType<typeof useCurrency>
  resultRef: React.RefObject<HTMLDivElement | null>
}

export default function Tier3ResultPanel({
  t,
  lang,
  result,
  breakEvenResult,
  isStale,
  t2Params,
  t3Params,
  currencyCtx,
  resultRef,
}: Props) {
  const scenarioLabels: Record<string, string> = {
    optimistic: t.lcoh3.optimistic,
    base: t.lcoh3.base,
    conservative: t.lcoh3.conservative,
  }

  return (
    /* 우: 결과 패널 (sticky) */
    <div className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
        {result ? (
          <div
            ref={resultRef}
            className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}
          >
            {/* 투자 요약 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">{t.lcoh3.summary}</h2>
            </div>
            <div className="mb-4 pb-3 border-b border-gray-100">
              <CurrencySelector {...currencyCtx} />
            </div>

            {/* KPI 카드 (2x3 그리드) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <SummaryCard
                label={`${t.lcoh3.npv} ${t.lcoh3.npvBasis}`}
                value={`${currencyCtx.currencyInfo.symbol}${(currencyCtx.convert(result.npv) / 1_000_000).toFixed(2)}M`}
                positive={result.npv >= 0}
              />
              <SummaryCard
                label={`${t.lcoh3.irr} ${t.lcoh3.irrBasis}`}
                value={isNaN(result.irr) ? (lang === 'ko' ? '수익성 없음' : 'N/A') : `${(result.irr * 100).toFixed(1)}%`}
                positive={!isNaN(result.irr) && result.irr > t2Params.wacc}
              />
              <SummaryCard
                label={t.lcoh3.paybackYear}
                value={result.paybackYear !== null ? `${result.paybackYear} ${t.lcoh3.paybackYearUnit}` : t.lcoh3.paybackNever}
                positive={result.paybackYear !== null}
              />
              <SummaryCard
                label={t.lcoh3.lcohRef}
                value={`${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}/kg`}
                positive={result.lcoh < t3Params.h2SellingPrice}
              />
              {breakEvenResult && (
                <div className="col-span-2">
                  <SummaryCard
                    label={t.lcoh3.breakEvenPrice}
                    value={
                      breakEvenResult.exceeded
                        ? `>${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(breakEvenResult.breakEvenPrice).toFixed(currencyCtx.currencyInfo.decimals)}/kg`
                        : `${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(breakEvenResult.breakEvenPrice).toFixed(currencyCtx.currencyInfo.decimals)}/kg`
                    }
                    positive={breakEvenResult.margin >= 0}
                    subLabel={breakEvenResult.margin >= 0 ? t.lcoh3.breakEvenPositive : t.lcoh3.breakEvenNegative}
                    subValue={
                      breakEvenResult.exceeded
                        ? t.lcoh3.breakEvenExceeded.replace('${price}', `${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(breakEvenResult.breakEvenPrice).toFixed(currencyCtx.currencyInfo.decimals)}`)
                        : `${breakEvenResult.margin >= 0 ? '+' : ''}${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(Math.abs(breakEvenResult.margin)).toFixed(currencyCtx.currencyInfo.decimals)}`
                    }
                  />
                </div>
              )}
            </div>

            {/* 시나리오 비교 */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                {t.lcoh3.scenarioComparison}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {result.scenarios.map((s) => {
                  const isOpt = s.id === 'optimistic'
                  const isBase = s.id === 'base'
                  const assumption = SCENARIO_ASSUMPTIONS[s.id]

                  return (
                    <div
                      key={s.id}
                      className={`border rounded-xl p-4 ${
                        isOpt
                          ? 'border-green-300 bg-green-50'
                          : isBase
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-amber-300 bg-amber-50'
                      }`}
                    >
                      {/* 시나리오 이름 */}
                      <div className="text-xs font-semibold text-gray-600 mb-0.5">
                        {scenarioLabels[s.id] ?? s.id}
                      </div>
                      {/* 가정 텍스트 */}
                      <div className="text-xs text-gray-400 mb-3">
                        {lang === 'ko' ? assumption.ko : assumption.en}
                      </div>

                      {/* NPV */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-500">NPV</div>
                        <div className={`text-xl font-bold ${s.npv >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {currencyCtx.currencyInfo.symbol}{(currencyCtx.convert(s.npv) / 1_000_000).toFixed(2)}M
                        </div>
                      </div>

                      {/* IRR + 회수 기간 */}
                      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 mt-2">
                        <span>
                          IRR {isNaN(s.irr)
                            ? (lang === 'ko' ? '수익성 없음' : 'N/A')
                            : `${(s.irr * 100).toFixed(1)}%`}
                        </span>
                        <span>
                          {s.paybackYear !== null
                            ? `${s.paybackYear}${lang === 'ko' ? '년 회수' : 'yr payback'}`
                            : (lang === 'ko' ? '회수 불가' : 'No payback')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* NPV 곡선 */}
            <div className="mt-5">
              <h3 className="text-xs font-medium text-gray-600 mb-3">{t.lcoh3.npvChart}</h3>
              <NpvChart cashFlows={result.cashFlows} t={t} paybackYear={result.paybackYear} />
            </div>
          </div>
        ) : (
          /* 결과 없을 때 플레이스홀더 */
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-sm">
              {lang === 'ko'
                ? '파라미터를 설정하고 계산을 실행하세요'
                : 'Set parameters and run calculation'}
            </div>
          </div>
        )}
      </div>
  )
}
