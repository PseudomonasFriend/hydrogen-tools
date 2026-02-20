'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SensitivityPoint } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  sensitivities: SensitivityPoint[]
  t: Translations
}

// paramKey → t.lcoh 또는 t.lcoh2의 레이블 키 매핑
const PARAM_TO_LCOH_KEY: Record<string, keyof Translations['lcoh']> = {
  capex: 'capex',
  capexPerTpd: 'capexPerTpd',
  electricityCost: 'electricityCost',
  naturalGasCostPerKgH2: 'naturalGasCost',
  capacityFactor: 'capacityFactor',
  energyConsumption: 'energyConsumption',
  opexRate: 'opexRate',
}

export default function TornadoChart({ sensitivities, t }: Props) {
  if (sensitivities.length === 0) return null

  const baseLcoh = sensitivities[0].baseLcoh

  const data = sensitivities.map((s) => {
    let label: string = s.paramKey
    if (s.paramKey === 'wacc') {
      label = t.lcoh2.wacc
    } else {
      const key = PARAM_TO_LCOH_KEY[s.paramKey]
      if (key) label = t.lcoh[key] as string
    }
    return {
      name: label,
      offset: s.lowLcoh,
      range: s.highLcoh - s.lowLcoh,
      lowLcoh: s.lowLcoh,
      highLcoh: s.highLcoh,
    }
  })

  const allVals = sensitivities.flatMap((s) => [s.lowLcoh, s.highLcoh])
  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)
  const pad = (maxVal - minVal) * 0.1

  return (
    <ResponsiveContainer width="100%" height={sensitivities.length * 44 + 48}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <XAxis
          type="number"
          domain={[Math.max(0, minVal - pad), maxVal + pad]}
          tickFormatter={(v: number) => `$${v.toFixed(1)}`}
          tick={{ fontSize: 11 }}
        />
        <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            if (name === 'offset') return [null, '']
            return [value != null ? `$${value.toFixed(3)}/kg H\u2082` : '-', t.lcoh2.sensitivityRange]
          }}
          labelFormatter={(label) => label}
        />
        <ReferenceLine
          x={baseLcoh}
          stroke="#6b7280"
          strokeWidth={2}
          strokeDasharray="4 2"
          label={{ value: `$${baseLcoh.toFixed(2)}`, fontSize: 10, fill: '#6b7280' }}
        />
        <Bar dataKey="offset" stackId="a" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="range" stackId="a" fill="#3b82f6" opacity={0.75} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
