'use client'

import { useState } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier1Result } from '@/lib/lcoh/types'
import { isSmrParams } from '@/lib/lcoh/types'
import type { Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH, calcSmrLCOH } from '@/lib/lcoh/calculations'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import type { RegionalPreset } from '@/lib/lcoh/presets'
import { validateElectrolyzerParams, validateSmrParams } from '@/lib/lcoh/validation'
import type { ValidationError } from '@/lib/lcoh/validation'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import PathwaySelector from './PathwaySelector'
import ResultChart from './ResultChart'

const SMR_PATHWAYS: PathwayId[] = ['smr', 'smr_ccs', 'atr_ccs', 'coal']

function isSmrPathway(id: PathwayId): boolean {
  return SMR_PATHWAYS.includes(id)
}

interface Props {
  t: Translations
  lang: Lang
}

function useInitialState() {
  const storage = useLcohStorage()
  const savedPathway = storage.loadPathway()
  if (savedPathway) {
    return {
      pathway: savedPathway,
      params: storage.loadParams(savedPathway, DEFAULT_PARAMS[savedPathway]),
    }
  }
  return {
    pathway: 'pem' as PathwayId,
    params: DEFAULT_PARAMS['pem'] as ElectrolyzerParams,
  }
}

export default function Tier1Calculator({ t, lang }: Props) {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [result, setResult] = useState<Tier1Result | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const storage = useLcohStorage()

  const handlePathwayChange = (newPathway: PathwayId) => {
    storage.savePathway(newPathway)
    setPathway(newPathway)
    setParams(storage.loadParams(newPathway, DEFAULT_PARAMS[newPathway]))
    setResult(null)
    setValidationErrors([])
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setResult(null)
    setValidationErrors([])
  }

  function handlePresetSelect(preset: RegionalPreset) {
    if (isSmrPathway(pathway)) {
      if (pathway === 'coal') {
        setParams((prev) => ({ ...prev, coalCostPerKgH2: preset.coalCost }))
      } else {
        setParams((prev) => ({ ...prev, naturalGasCostPerKgH2: preset.naturalGasCost }))
      }
    } else {
      setParams((prev) => ({ ...prev, electricityCost: preset.electricityCost }))
    }
  }

  const handleCalculate = () => {
    const errors = isSmrParams(params)
      ? validateSmrParams(params)
      : validateElectrolyzerParams(params as ElectrolyzerParams)

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])

    // 계산 성공 전 저장
    storage.saveParams(pathway, params)

    if (isSmrPathway(pathway)) {
      setResult(calcSmrLCOH(params as SmrParams))
    } else {
      setResult(calcElectrolyzerLCOH(params as ElectrolyzerParams))
    }
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  // 에러 있는 필드 확인 헬퍼
  const fieldError = (field: string) =>
    validationErrors.find((e) => e.field === field)?.message

  const isSmr = isSmrPathway(pathway)

  return (
    <div className="space-y-6">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} />

      {/* 지역 프리셋 */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-sm text-gray-500">{t.lcoh2.regionalPreset}:</span>
        {REGIONAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            {lang === 'ko' ? preset.labelKo : preset.labelEn}
          </button>
        ))}
      </div>

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
                error={fieldError('plantCapacity')}
              />
              <NumInput
                label={t.lcoh.capexPerTpd}
                value={(params as SmrParams).capexPerTpd}
                onChange={(v) => setField('capexPerTpd', v)}
                step={100000}
                error={fieldError('capexPerTpd')}
              />
              <NumInput
                label={t.lcoh.opexRate}
                value={(params as SmrParams).opexRate * 100}
                onChange={(v) => setField('opexRate', v / 100)}
                step={0.5}
                min={0}
                max={20}
                error={fieldError('opexRate')}
              />
              <NumInput
                label={t.lcoh.capacityFactor}
                value={(params as SmrParams).capacityFactor * 100}
                onChange={(v) => setField('capacityFactor', v / 100)}
                step={1}
                min={0}
                max={100}
                error={fieldError('capacityFactor')}
              />
              <div>
                <NumInput
                  label={t.lcoh.naturalGasCost}
                  value={(params as SmrParams).naturalGasCostPerKgH2}
                  onChange={(v) => setField('naturalGasCostPerKgH2', v)}
                  step={0.1}
                  error={fieldError('naturalGasCostPerKgH2')}
                />
                <p className="text-xs text-gray-400 mt-1">※ $/MMBtu × 0.20 ≈ $/kg H₂</p>
              </div>
              {(pathway === 'smr_ccs' || pathway === 'atr_ccs') && (
                <NumInput
                  label={t.lcoh.ccsCost}
                  value={(params as SmrParams).ccsCostPerKgH2 ?? 0}
                  onChange={(v) => setField('ccsCostPerKgH2', v)}
                  step={0.1}
                  error={fieldError('ccsCostPerKgH2')}
                />
              )}
              {pathway === 'coal' && (
                <NumInput
                  label={t.lcoh.coalCost}
                  value={(params as SmrParams).coalCostPerKgH2 ?? 0}
                  onChange={(v) => setField('coalCostPerKgH2', v)}
                  step={0.05}
                  error={fieldError('coalCostPerKgH2')}
                />
              )}
              <NumInput
                label={t.lcoh.lifetime}
                value={(params as SmrParams).lifetime}
                onChange={(v) => setField('lifetime', v)}
                step={1}
                min={5}
                max={40}
                error={fieldError('lifetime')}
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
                error={fieldError('systemCapacity')}
              />
              <NumInput
                label={t.lcoh.capex}
                value={(params as ElectrolyzerParams).capex}
                onChange={(v) => setField('capex', v)}
                step={50}
                error={fieldError('capex')}
              />
              <NumInput
                label={t.lcoh.opexRate}
                value={(params as ElectrolyzerParams).opexRate * 100}
                onChange={(v) => setField('opexRate', v / 100)}
                step={0.5}
                min={0}
                max={20}
                error={fieldError('opexRate')}
              />
              <NumInput
                label={t.lcoh.capacityFactor}
                value={(params as ElectrolyzerParams).capacityFactor * 100}
                onChange={(v) => setField('capacityFactor', v / 100)}
                step={1}
                min={0}
                max={100}
                error={fieldError('capacityFactor')}
              />
              <NumInput
                label={t.lcoh.energyConsumption}
                value={(params as ElectrolyzerParams).energyConsumption}
                onChange={(v) => setField('energyConsumption', v)}
                step={1}
                error={fieldError('energyConsumption')}
              />
              <NumInput
                label={t.lcoh.electricityCost}
                value={(params as ElectrolyzerParams).electricityCost}
                onChange={(v) => setField('electricityCost', v)}
                step={0.01}
                error={fieldError('electricityCost')}
              />
              <NumInput
                label={t.lcoh.lifetime}
                value={(params as ElectrolyzerParams).lifetime}
                onChange={(v) => setField('lifetime', v)}
                step={1}
                min={5}
                max={40}
                error={fieldError('lifetime')}
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
  error,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  error?: string
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
        className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
