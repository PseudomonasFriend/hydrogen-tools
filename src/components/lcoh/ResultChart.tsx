'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Tier1Result } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  result: Tier1Result
  t: Translations
}

export default function ResultChart({ result, t }: Props) {
  const data = [
    {
      name: t.lcoh.costBreakdown,
      [t.lcoh.capexLabel]: parseFloat(result.capexComponent.toFixed(3)),
      [t.lcoh.opexLabel]: parseFloat(result.opexComponent.toFixed(3)),
      [t.lcoh.fuelLabel]: parseFloat(result.fuelComponent.toFixed(3)),
    },
  ]

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">{t.lcoh.costBreakdown}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            tick={{ fontSize: 12 }}
            label={{
              value: '$/kg H₂',
              angle: -90,
              position: 'insideLeft',
              offset: -5,
              style: { fontSize: 11 },
            }}
          />
          <Tooltip formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(3)}/kg H₂` : '-']} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey={t.lcoh.capexLabel} stackId="a" fill="#3b82f6" />
          <Bar dataKey={t.lcoh.opexLabel} stackId="a" fill="#f59e0b" />
          <Bar dataKey={t.lcoh.fuelLabel} stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
