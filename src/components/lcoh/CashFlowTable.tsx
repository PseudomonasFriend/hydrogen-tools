'use client'

import type { CashFlowRow } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  cashFlows: CashFlowRow[]
  t: Translations
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function CashFlowTable({ cashFlows, t }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2 px-2 text-left font-medium">{t.lcoh3.year}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.revenue}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.opex}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.fuel}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.tax}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.netCashFlow}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.cumulativeCF}</th>
            <th className="py-2 px-2 text-right font-medium">{t.lcoh3.cumulativePV}</th>
          </tr>
        </thead>
        <tbody>
          {cashFlows.map((row) => (
            <tr
              key={row.year}
              className={`border-b border-gray-100 ${row.cumulativeCF >= 0 && row.year > 0 ? 'bg-green-50' : ''}`}
            >
              <td className="py-1.5 px-2 text-gray-700 font-medium">{row.year}</td>
              <td className="py-1.5 px-2 text-right text-gray-600">{row.year === 0 ? '-' : fmt(row.revenue)}</td>
              <td className="py-1.5 px-2 text-right text-gray-600">{row.year === 0 ? '-' : fmt(row.opex)}</td>
              <td className="py-1.5 px-2 text-right text-gray-600">{row.year === 0 ? '-' : fmt(row.fuel)}</td>
              <td className="py-1.5 px-2 text-right text-gray-600">{row.year === 0 ? '-' : fmt(row.tax)}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
