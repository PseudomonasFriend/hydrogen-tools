'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Label,
} from 'recharts'
import type { SensitivityPoint } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'

interface Props {
  sensitivities: SensitivityPoint[]
  t: Translations
  lang?: Lang
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

interface ChartRow {
  name: string
  negDelta: number
  posDelta: number
  lowLcoh: number
  highLcoh: number
}

export default function TornadoChart({ sensitivities, t, lang = 'ko' }: Props) {
  if (sensitivities.length === 0) return null

  const baseLcoh = sensitivities[0].baseLcoh

  const chartData: ChartRow[] = sensitivities
    .map((s) => {
      let label: string = s.paramKey
      if (s.paramKey === 'wacc') {
        label = t.lcoh2.wacc
      } else {
        const key = PARAM_TO_LCOH_KEY[s.paramKey]
        if (key) label = t.lcoh[key] as string
      }
      return {
        name: label,
        negDelta: +(s.lowLcoh - baseLcoh).toFixed(3),
        posDelta: +(s.highLcoh - baseLcoh).toFixed(3),
        lowLcoh: s.lowLcoh,
        highLcoh: s.highLcoh,
      }
    })
    // 영향력 크기(swing) 기준 내림차순 정렬 (큰 것이 위)
    .sort((a, b) => (b.posDelta - b.negDelta) - (a.posDelta - a.negDelta))

  const maxSwing = Math.max(
    ...chartData.map((d) => Math.max(Math.abs(d.negDelta), Math.abs(d.posDelta))),
  )
  const domainMax = maxSwing * 1.25

  // YAxis 레이블 폭: 가장 긴 이름 기준
  const labelWidth = Math.min(
    200,
    Math.max(120, Math.max(...chartData.map((d) => d.name.length)) * 7),
  )

  return (
    <ResponsiveContainer width="100%" height={chartData.length * 44 + 72}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 40, bottom: 10, left: labelWidth }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[-domainMax, domainMax]}
          tickFormatter={(v: number) => {
            if (v === 0) return '0'
            return v > 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`
          }}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={labelWidth}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => {
            const numValue = value ?? 0
            if (name === 'negDelta') {
              const row = chartData.find((d) => d.negDelta === numValue)
              const actualLcoh = row ? row.lowLcoh : baseLcoh + numValue
              return [
                `$${actualLcoh.toFixed(3)}/kg H\u2082`,
                lang === 'ko' ? '파라미터 감소 (-20%)' : '-20% param',
              ]
            }
            if (name === 'posDelta') {
              const row = chartData.find((d) => d.posDelta === numValue)
              const actualLcoh = row ? row.highLcoh : baseLcoh + numValue
              return [
                `$${actualLcoh.toFixed(3)}/kg H\u2082`,
                lang === 'ko' ? '파라미터 증가 (+20%)' : '+20% param',
              ]
            }
            return [numValue, name ?? '']
          }}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) =>
            value === 'negDelta'
              ? lang === 'ko'
                ? '파라미터 감소 (-20%)'
                : 'Param -20%'
              : lang === 'ko'
              ? '파라미터 증가 (+20%)'
              : 'Param +20%'
          }
        />
        <ReferenceLine x={0} stroke="#6b7280" strokeWidth={2}>
          <Label
            value={lang === 'ko' ? `기준 $${baseLcoh.toFixed(2)}` : `Base $${baseLcoh.toFixed(2)}`}
            position="insideTop"
            style={{ fontSize: 10, fill: '#6b7280' }}
          />
        </ReferenceLine>
        {/* 감소 방향: 빨강 */}
        <Bar dataKey="negDelta" fill="#ef4444" opacity={0.75} radius={[3, 0, 0, 3]} isAnimationActive={false} />
        {/* 증가 방향: 파랑 */}
        <Bar dataKey="posDelta" fill="#3b82f6" opacity={0.75} radius={[0, 3, 3, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
