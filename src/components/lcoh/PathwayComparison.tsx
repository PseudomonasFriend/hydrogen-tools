'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import { PATHWAY_ORDER, DEFAULT_PARAMS } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH, calcSmrLCOH } from '@/lib/lcoh/calculations'
import type { ElectrolyzerParams, SmrParams } from '@/lib/lcoh/types'

const SMR_PATHWAYS = ['smr', 'smr_ccs', 'atr_ccs', 'coal']

// 경로별 색상
const PATHWAY_COLOR_MAP: Record<string, string> = {
  pem: '#22c55e',
  alk: '#16a34a',
  aem: '#4ade80',
  soec: '#86efac',
  smr: '#9ca3af',
  smr_ccs: '#3b82f6',
  atr_ccs: '#60a5fa',
  coal: '#f59e0b',
}

interface Props {
  t: Translations
  lang: Lang
}

export default function PathwayComparison({ t, lang }: Props) {
  const [electricityCost, setElectricityCost] = useState(0.05)
  const [naturalGasCost, setNaturalGasCost] = useState(1.2)
  const [coalCost, setCoalCost] = useState(0.6)

  // 8개 경로 LCOH 계산
  const data = PATHWAY_ORDER.map((id) => {
    const base = DEFAULT_PARAMS[id]
    let lcoh: number
    if (SMR_PATHWAYS.includes(id)) {
      const p = { ...(base as SmrParams) }
      if (id === 'coal') {
        p.coalCostPerKgH2 = coalCost
      } else {
        p.naturalGasCostPerKgH2 = naturalGasCost
      }
      lcoh = calcSmrLCOH(p).lcoh
    } else {
      const p = { ...(base as ElectrolyzerParams), electricityCost }
      lcoh = calcElectrolyzerLCOH(p).lcoh
    }
    const pathwayName = t.pathways[id]
    return { id, name: pathwayName, lcoh: parseFloat(lcoh.toFixed(2)) }
  })

  // LCOH 오름차순 정렬
  const sorted = [...data].sort((a, b) => a.lcoh - b.lcoh)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-medium text-gray-600 mb-1">
        {lang === 'ko' ? '전체 경로 비교 (Tier 1)' : 'All Pathway Comparison (Tier 1)'}
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        {lang === 'ko'
          ? '에너지 단가를 변경하면 8개 경로 LCOH가 실시간 업데이트됩니다.'
          : 'Change energy costs to update all 8 pathway LCOHs in real time.'}
      </p>

      {/* 에너지 단가 입력 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {lang === 'ko' ? '전기 단가 ($/kWh)' : 'Electricity ($/kWh)'}
          </label>
          <input
            type="number"
            value={electricityCost}
            step={0.01}
            min={0.01}
            onChange={(e) => setElectricityCost(parseFloat(e.target.value) || 0.05)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {lang === 'ko' ? '천연가스 ($/kg H₂)' : 'Natural Gas ($/kg H₂)'}
          </label>
          <p className="text-xs text-gray-400 mb-1">※ $/MMBtu × 0.12 ≈ $/kg H₂</p>
          <input
            type="number"
            value={naturalGasCost}
            step={0.1}
            min={0}
            onChange={(e) => setNaturalGasCost(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {lang === 'ko' ? '석탄 ($/kg H₂)' : 'Coal ($/kg H₂)'}
          </label>
          <input
            type="number"
            value={coalCost}
            step={0.05}
            min={0}
            onChange={(e) => setCoalCost(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 10 }}
              label={{ value: '$/kg H₂', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10 } }}
            />
            <Tooltip
              formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(2)}/kg H₂` : '-', 'LCOH']}
            />
            <Bar dataKey="lcoh" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="lcoh" position="top" formatter={(v: string | number | boolean | null | undefined) => typeof v === 'number' ? `$${v.toFixed(1)}` : ''} style={{ fontSize: 9 }} />
              {sorted.map((entry) => (
                <Cell key={entry.id} fill={PATHWAY_COLOR_MAP[entry.id]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs text-gray-500 font-medium">{lang === 'ko' ? '순위' : 'Rank'}</th>
              <th className="text-left py-2 text-xs text-gray-500 font-medium">{lang === 'ko' ? '경로' : 'Pathway'}</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">LCOH ($/kg H₂)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.id} className={`border-b border-gray-100 ${i === 0 ? 'bg-green-50' : ''}`}>
                <td className="py-1.5 text-xs text-gray-500">{i + 1}</td>
                <td className="py-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: PATHWAY_COLOR_MAP[row.id] }}
                    />
                    <span className="text-xs font-medium text-gray-700">{row.name}</span>
                  </span>
                </td>
                <td className="py-1.5 text-right text-xs font-bold text-gray-800">${row.lcoh.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
