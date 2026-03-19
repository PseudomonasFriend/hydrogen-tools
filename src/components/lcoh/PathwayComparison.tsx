'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import { PATHWAY_ORDER, DEFAULT_PARAMS, DEFAULT_T2_EXTRA } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH, calcSmrLCOH, calcElectrolyzerLCOH_T2, calcSmrLCOH_T2 } from '@/lib/lcoh/calculations'
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

// 경로별 CO2 배출 강도 (kg CO₂/kg H₂)
const CO2_INTENSITY: Record<string, string> = {
  pem: '~0',
  alk: '~0',
  aem: '~0',
  soec: '~0',
  smr: '9.0',
  smr_ccs: '1.5',
  atr_ccs: '1.0',
  coal: '25.0',
}

interface Props {
  t: Translations
  lang: Lang
}

export default function PathwayComparison({ t }: Props) {
  const [electricityCost, setElectricityCost] = useState(0.05)
  const [naturalGasCost, setNaturalGasCost] = useState(1.2)
  const [coalCost, setCoalCost] = useState(0.6)
  const [compareMode, setCompareMode] = useState<'tier1' | 'tier2'>('tier1')
  const [wacc, setWacc] = useState(0.08)

  // 8개 경로 LCOH 계산
  const data = PATHWAY_ORDER.map((id) => {
    const base = DEFAULT_PARAMS[id]
    let lcoh: number
    if (compareMode === 'tier1') {
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
    } else {
      // Tier 2: WACC 할인 적용
      const t2 = { ...DEFAULT_T2_EXTRA[id], wacc }
      if (SMR_PATHWAYS.includes(id)) {
        const p = { ...(base as SmrParams) }
        if (id === 'coal') {
          p.coalCostPerKgH2 = coalCost
        } else {
          p.naturalGasCostPerKgH2 = naturalGasCost
        }
        lcoh = calcSmrLCOH_T2(p, t2).lcoh
      } else {
        const p = { ...(base as ElectrolyzerParams), electricityCost }
        lcoh = calcElectrolyzerLCOH_T2(p, t2).lcoh
      }
    }
    const pathwayName = t.pathways[id]
    return { id, name: pathwayName, lcoh: parseFloat(lcoh.toFixed(2)) }
  })

  // LCOH 오름차순 정렬
  const sorted = [...data].sort((a, b) => a.lcoh - b.lcoh)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-medium text-gray-600 mb-1">
        {t.common.comparisonTitle}
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        {t.common.comparisonDesc}
      </p>

      {/* 에너지 단가 입력 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t.lcoh.electricityCost}
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
            {t.lcoh.naturalGasCost}
          </label>
          <p className="text-xs text-gray-400 mb-1">※ $/MMBtu × 0.20 ≈ $/kg H₂</p>
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
            {t.lcoh.coalCost}
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

      {/* Tier 비교 모드 선택 */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs text-gray-500">
          {t.common.compareBy}
        </span>
        <button
          onClick={() => setCompareMode('tier1')}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            compareMode === 'tier1'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:border-blue-400'
          }`}
        >
          Tier 1 (단순)
        </button>
        <button
          onClick={() => setCompareMode('tier2')}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            compareMode === 'tier2'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:border-blue-400'
          }`}
        >
          Tier 2 (WACC 할인)
        </button>
        {compareMode === 'tier2' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">WACC (%)</label>
            <input
              type="number"
              value={wacc * 100}
              step={0.5}
              min={3}
              max={20}
              onChange={(e) => setWacc(parseFloat(e.target.value) / 100 || 0.08)}
              className="w-20 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
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
              <th className="text-left py-2 text-xs text-gray-500 font-medium">#</th>
              <th className="text-left py-2 text-xs text-gray-500 font-medium">{t.lcoh.pathway}</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">LCOH ($/kg H₂)</th>
              <th className="text-right py-2 text-xs text-gray-500 font-medium">
                CO₂ (kg/kg H₂)
              </th>
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
                <td className="py-1.5 text-right text-xs text-gray-600">
                  {CO2_INTENSITY[row.id]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
