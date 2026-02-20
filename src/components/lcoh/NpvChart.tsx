'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { CashFlowRow } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  cashFlows: CashFlowRow[]
  t: Translations
}

function fmtAxis(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function NpvChart({ cashFlows, t }: Props) {
  const data = cashFlows.map((row) => ({
    year: row.year,
    [t.lcoh3.cumulativeCF]: Math.round(row.cumulativeCF),
    [t.lcoh3.cumulativePV]: Math.round(row.cumulativePV),
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12 }}
          label={{ value: t.lcoh3.year, position: 'insideBottomRight', offset: -5, style: { fontSize: 11 } }}
        />
        <YAxis
          tickFormatter={fmtAxis}
          tick={{ fontSize: 12 }}
          label={{ value: '$', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 11 } }}
        />
        <Tooltip
          formatter={(value: number | undefined) => [value != null ? fmtAxis(value) : '-']}
          labelFormatter={(label) => `${t.lcoh3.year} ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey={t.lcoh3.cumulativeCF}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey={t.lcoh3.cumulativePV}
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
