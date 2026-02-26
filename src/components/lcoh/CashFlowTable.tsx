'use client'

import { useState } from 'react'
import type { CashFlowRow, Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  cashFlows: CashFlowRow[]
  t: Translations
  lang: Lang
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// 0 또는 음수에 가까운 값은 '-' 로 표시 (스택 교체비 등 대부분 연도 0인 경우 가독성)
function fmtOrDash(n: number): string {
  if (n === 0) return '-'
  return fmt(n)
}

export default function CashFlowTable({ cashFlows, t, lang }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  // paybackYear: cumulativeCF >= 0이 되는 첫 번째 운영 연도 (year > 0)
  const paybackYear = cashFlows.find(r => r.year > 0 && r.cumulativeCF >= 0)?.year ?? null

  return (
    <div>
      {/* 헤더 + 상세 토글 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">
          {lang === 'ko' ? '연도별 현금흐름' : 'Annual Cash Flow'}
        </h3>
        <button
          type="button"
          onClick={() => setShowDetail(v => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {showDetail
            ? (lang === 'ko' ? '간략 보기' : 'Compact View')
            : (lang === 'ko' ? '상세 보기 (매출·비용·세금)' : 'Detailed View')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 px-2 text-left font-medium">{t.lcoh3.year}</th>
              {showDetail && (
                <>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.revenue}</th>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.opex}</th>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.fuel}</th>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.stackRepl}</th>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.depreciation}</th>
                  <th className="py-2 px-2 text-right font-medium">{t.lcoh3.tax}</th>
                </>
              )}
              <th className="py-2 px-2 text-right font-medium">{t.lcoh3.netCashFlow}</th>
              <th className="py-2 px-2 text-right font-medium">{t.lcoh3.cumulativeCF}</th>
              <th className="py-2 px-2 text-right font-medium">{t.lcoh3.cumulativePV}</th>
            </tr>
          </thead>
          <tbody>
            {cashFlows.map((row) => {
              const isConstruction = row.revenue === 0 && row.year <= 0
              const isPayback = paybackYear !== null && row.year === paybackYear
              const rowBg = isPayback
                ? 'bg-blue-50'
                : (row.netCashFlow >= 0 && row.year > 0)
                ? 'bg-green-50'
                : isConstruction
                ? 'bg-gray-50'
                : ''

              return (
                <tr key={row.year} className={`border-b border-gray-100 ${rowBg}`}>
                  <td className="py-1.5 px-2 text-gray-700 font-medium whitespace-nowrap">
                    {row.year}
                    {isPayback && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                        BEP
                      </span>
                    )}
                  </td>
                  {showDetail && (
                    <>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmt(row.revenue)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmt(row.opex)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmt(row.fuel)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmtOrDash(row.stackRepl)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmtOrDash(row.depreciation)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{row.year <= 0 ? '-' : fmt(row.tax)}</td>
                    </>
                  )}
                  <td className={`py-1.5 px-2 text-right font-medium ${row.netCashFlow >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(row.netCashFlow)}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${row.cumulativeCF >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(row.cumulativeCF)}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${row.cumulativePV >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(row.cumulativePV)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
