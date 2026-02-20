'use client'

import { useState } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier1Result } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH, calcSmrLCOH } from '@/lib/lcoh/calculations'
import PathwaySelector from './PathwaySelector'
import ResultChart from './ResultChart'

const SMR_PATHWAYS: PathwayId[] = ['smr', 'smr_ccs', 'atr_ccs', 'coal']

function isSmrPathway(id: PathwayId): boolean {
  return SMR_PATHWAYS.includes(id)
}

interface Props {
  t: Translations
}

export default function Tier1Calculator({ t }: Props) {
  const [pathway, setPathway] = useState<PathwayId>('pem')
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(DEFAULT_PARAMS['pem'] as ElectrolyzerParams)
  const [result, setResult] = useState<Tier1Result | null>(null)

  const handlePathwayChange = (id: PathwayId) => {
    setPathway(id)
    setParams(DEFAULT_PARAMS[id])
    setResult(null)
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setResult(null)
  }

  const handleCalculate = () => {
    if (isSmrPathway(pathway)) {
      setResult(calcSmrLCOH(params as SmrParams))
    } else {
      setResult(calcElectrolyzerLCOH(params as ElectrolyzerParams))
    }
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const isSmr = isSmrPathway(pathway)

  return (
    <div className="space-y-6">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} />

      {/* 파라미터 입력 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-600">{t.lcoh.params}</h2>
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {t.lcoh.resetDefaults}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isSmr ? (
            // SMR 경로 파라미터
            <>
              <NumInput
                label={t.lcoh.plantCapacity}
                value={(params as SmrParams).plantCapacity}
                onChange={(v) => setField('plantCapacity', v)}
                step={10}
              />
              <NumInput
                label={t.lcoh.capexPerTpd}
                value={(params as SmrParams).capexPerTpd}
                onChange={(v) => setField('capexPerTpd', v)}
                step={100000}
              />
              <NumInput
                label={t.lcoh.opexRate}
                value={(params as SmrParams).opexRate * 100}
                onChange={(v) => setField('opexRate', v / 100)}
                step={0.5}
                min={0}
                max={20}
              />
              <NumInput
                label={t.lcoh.capacityFactor}
                value={(params as SmrParams).capacityFactor * 100}
                onChange={(v) => setField('capacityFactor', v / 100)}
                step={1}
                min={0}
                max={100}
              />
              <NumInput
                label={t.lcoh.naturalGasCost}
                value={(params as SmrParams).naturalGasCostPerKgH2}
                onChange={(v) => setField('naturalGasCostPerKgH2', v)}
                step={0.1}
              />
              {(pathway === 'smr_ccs' || pathway === 'atr_ccs') && (
                <NumInput
                  label={t.lcoh.ccsCost}
                  value={(params as SmrParams).ccsCostPerKgH2 ?? 0}
                  onChange={(v) => setField('ccsCostPerKgH2', v)}
                  step={0.1}
                />
              )}
              {pathway === 'coal' && (
                <NumInput
                  label={t.lcoh.coalCost}
                  value={(params as SmrParams).coalCostPerKgH2 ?? 0}
                  onChange={(v) => setField('coalCostPerKgH2', v)}
                  step={0.05}
                />
              )}
              <NumInput
                label={t.lcoh.lifetime}
                value={(params as SmrParams).lifetime}
                onChange={(v) => setField('lifetime', v)}
                step={1}
                min={5}
                max={40}
              />
            </>
          ) : (
            // 전해조 경로 파라미터
            <>
              <NumInput
                label={t.lcoh.systemCapacity}
                value={(params as ElectrolyzerParams).systemCapacity}
                onChange={(v) => setField('systemCapacity', v)}
                step={100}
              />
              <NumInput
                label={t.lcoh.capex}
                value={(params as ElectrolyzerParams).capex}
                onChange={(v) => setField('capex', v)}
                step={50}
              />
              <NumInput
                label={t.lcoh.opexRate}
                value={(params as ElectrolyzerParams).opexRate * 100}
                onChange={(v) => setField('opexRate', v / 100)}
                step={0.5}
                min={0}
                max={20}
              />
              <NumInput
                label={t.lcoh.capacityFactor}
                value={(params as ElectrolyzerParams).capacityFactor * 100}
                onChange={(v) => setField('capacityFactor', v / 100)}
                step={1}
                min={0}
                max={100}
              />
              <NumInput
                label={t.lcoh.energyConsumption}
                value={(params as ElectrolyzerParams).energyConsumption}
                onChange={(v) => setField('energyConsumption', v)}
                step={1}
              />
              <NumInput
                label={t.lcoh.electricityCost}
                value={(params as ElectrolyzerParams).electricityCost}
                onChange={(v) => setField('electricityCost', v)}
                step={0.01}
              />
              <NumInput
                label={t.lcoh.lifetime}
                value={(params as ElectrolyzerParams).lifetime}
                onChange={(v) => setField('lifetime', v)}
                step={1}
                min={5}
                max={40}
              />
            </>
          )}
        </div>

        <button
          onClick={handleCalculate}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {t.lcoh.calculate}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh.result}</h2>

          {/* LCOH 메인 숫자 */}
          <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
            <div className="text-sm text-blue-600 mb-1">{t.lcoh.lcohResult}</div>
            <div className="text-4xl font-bold text-blue-700">
              ${result.lcoh.toFixed(2)}
            </div>
            <div className="text-sm text-blue-500 mt-1">{t.lcoh.unit}</div>
          </div>

          {/* 연간 생산량 */}
          <div className="text-center text-sm text-gray-600 mb-4">
            <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
            {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })} {t.lcoh.annualProductionUnit}
          </div>

          {/* 비용 구성 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <CostBadge label={t.lcoh.capexLabel} value={result.capexComponent} color="blue" />
            <CostBadge label={t.lcoh.opexLabel} value={result.opexComponent} color="amber" />
            <CostBadge label={t.lcoh.fuelLabel} value={result.fuelComponent} color="red" />
          </div>

          {/* 차트 */}
          <ResultChart result={result} t={t} />
        </div>
      )}
    </div>
  )
}

function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function CostBadge({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'red'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <div className={`border rounded-lg p-2 text-center ${colorMap[color]}`}>
      <div className="text-xs truncate mb-1">{label}</div>
      <div className="text-sm font-semibold">${value.toFixed(3)}</div>
    </div>
  )
}
