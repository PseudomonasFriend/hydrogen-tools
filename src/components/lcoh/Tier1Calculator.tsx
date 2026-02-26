'use client'

import { useState, useRef } from 'react'
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
import { useCurrency } from '@/hooks/useCurrency'
import PathwaySelector from './PathwaySelector'
import ResultChart from './ResultChart'
import CapexBreakdown from './CapexBreakdown'
import SmrCapexBreakdown from './SmrCapexBreakdown'
import CurrencySelector from '@/components/CurrencySelector'

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
  const [capacityMode, setCapacityMode] = useState<'system' | 'production'>('production')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [targetH2KgPerDay, setTargetH2KgPerDay] = useState<number>(() => {
    const p = initialState.params as ElectrolyzerParams
    return Math.round(p.systemCapacity * p.capacityFactor * 24 / (p.energyConsumption || 52))
  })

  const storage = useLcohStorage()
  const currencyCtx = useCurrency()
  const resultRef = useRef<HTMLDivElement>(null)

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
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  // 생산량 기준 모드: kg/day 입력 → systemCapacity 역산
  const handleProductionChange = (kgPerDay: number) => {
    setTargetH2KgPerDay(kgPerDay)
    const elecP = params as ElectrolyzerParams
    if (!elecP.capacityFactor || !elecP.energyConsumption) return
    const derived = kgPerDay * elecP.energyConsumption / (24 * elecP.capacityFactor)
    setField('systemCapacity', Math.round(derived))
  }

  // 에러 있는 필드 확인 헬퍼
  const fieldError = (field: string) =>
    validationErrors.find((e) => e.field === field)?.message

  const isSmr = isSmrPathway(pathway)

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* 좌: 파라미터 */}
        <div className="w-full lg:w-[55%] space-y-4">

          {/* 지역 에너지 가격 프리셋 카드 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-700">
                {lang === 'ko' ? '지역 에너지 가격 프리셋' : 'Regional Energy Preset'}
              </h3>
              <span className="ml-auto text-xs text-slate-400">
                {lang === 'ko' ? '클릭 시 에너지 비용 자동 적용' : 'Click to apply energy cost'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGIONAL_PRESETS.map(preset => (
                <button key={preset.id} type="button" onClick={() => handlePresetSelect(preset)}
                  className="flex flex-col items-start px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <span className="text-xs font-semibold text-slate-700">
                    {lang === 'ko' ? preset.labelKo : preset.labelEn}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {isSmr
                      ? `가스 $${preset.naturalGasCost}/kg`
                      : `전기 $${preset.electricityCost}/kWh`
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 파라미터 카드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.params}</h2>
              <button
                onClick={handleReset}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {t.lcoh.resetDefaults}
              </button>
            </div>

            {isSmr ? (
              // SMR 경로 파라미터
              <>
                {/* 기본 파라미터 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumInput
                    label={t.lcoh.plantCapacity}
                    value={(params as SmrParams).plantCapacity}
                    onChange={(v) => setField('plantCapacity', v)}
                    step={10}
                    unit="t/day"
                    error={fieldError('plantCapacity')}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.lcoh.capexPerTpd}</label>
                    <SmrCapexBreakdown
                      pathway={pathway}
                      capexPerTpd={(params as SmrParams).capexPerTpd}
                      onCapexChange={(v) => setField('capexPerTpd', v)}
                      lang={lang}
                      t={t}
                    />
                    {fieldError('capexPerTpd') && (
                      <p className="mt-1 text-xs text-red-500">{fieldError('capexPerTpd')}</p>
                    )}
                  </div>
                  <div>
                    <NumInput
                      label={t.lcoh.naturalGasCost}
                      value={(params as SmrParams).naturalGasCostPerKgH2}
                      onChange={(v) => setField('naturalGasCostPerKgH2', v)}
                      step={0.1}
                      unit="$/kg H₂"
                      error={fieldError('naturalGasCostPerKgH2')}
                    />
                    <p className="text-xs text-gray-400 mt-1">※ $/MMBtu × 0.15 ≈ $/kg H₂ (SMR, ~170 MJ/kg H₂ 기준)</p>
                  </div>
                  {(pathway === 'smr_ccs' || pathway === 'atr_ccs') && (
                    <NumInput
                      label={t.lcoh.ccsCost}
                      value={(params as SmrParams).ccsCostPerKgH2 ?? 0}
                      onChange={(v) => setField('ccsCostPerKgH2', v)}
                      step={0.1}
                      unit="$/kg H₂"
                      error={fieldError('ccsCostPerKgH2')}
                    />
                  )}
                  {pathway === 'coal' && (
                    <NumInput
                      label={t.lcoh.coalCost}
                      value={(params as SmrParams).coalCostPerKgH2 ?? 0}
                      onChange={(v) => setField('coalCostPerKgH2', v)}
                      step={0.05}
                      unit="$/kg H₂"
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
                    unit="년"
                    error={fieldError('lifetime')}
                  />
                </div>

                {/* SMR 고급 설정 토글 */}
                <button type="button" onClick={() => setShowAdvanced(v => !v)}
                  className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showAdvanced
                    ? (lang === 'ko' ? '고급 설정 접기' : 'Hide Advanced')
                    : (lang === 'ko' ? '고급 설정 (O&M율, 가동률)' : 'Advanced Settings (O&M, capacity factor)')
                  }
                </button>

                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumInput
                      label={t.lcoh.opexRate}
                      value={(params as SmrParams).opexRate * 100}
                      onChange={(v) => setField('opexRate', v / 100)}
                      step={0.5}
                      min={0}
                      max={20}
                      unit="%"
                      error={fieldError('opexRate')}
                    />
                    <NumInput
                      label={t.lcoh.capacityFactor}
                      value={(params as SmrParams).capacityFactor * 100}
                      onChange={(v) => setField('capacityFactor', v / 100)}
                      step={1}
                      min={0}
                      max={100}
                      unit="%"
                      error={fieldError('capacityFactor')}
                    />
                  </div>
                )}
              </>
            ) : (
              // 전해조 경로 파라미터
              <>
                {/* 입력 기준 토글 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-gray-500">{t.lcoh.capacityMode}:</span>
                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setCapacityMode('system')}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        capacityMode === 'system'
                          ? 'bg-white text-blue-700 font-medium shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t.lcoh.capacityModeSystem}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapacityMode('production')}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        capacityMode === 'production'
                          ? 'bg-white text-blue-700 font-medium shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t.lcoh.capacityModeProduction}
                    </button>
                  </div>
                </div>

                {/* 기본 파라미터 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 모드별 첫 번째 입력 */}
                  {capacityMode === 'system' ? (
                    <div>
                      <NumInput
                        label={t.lcoh.systemCapacity}
                        value={(params as ElectrolyzerParams).systemCapacity}
                        onChange={(v) => {
                          setField('systemCapacity', v)
                          const elecP = params as ElectrolyzerParams
                          if (elecP.energyConsumption) {
                            setTargetH2KgPerDay(Math.round(v * elecP.capacityFactor * 24 / elecP.energyConsumption))
                          }
                        }}
                        step={100}
                        unit="kW"
                        error={fieldError('systemCapacity')}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t.lcoh.derivedDailyProduction}: {(params as ElectrolyzerParams).energyConsumption ? Math.round((params as ElectrolyzerParams).systemCapacity * (params as ElectrolyzerParams).capacityFactor * 24 / (params as ElectrolyzerParams).energyConsumption).toLocaleString() : '—'} kg/day
                      </p>
                    </div>
                  ) : (
                    <div>
                      <NumInput
                        label={t.lcoh.targetH2Production}
                        value={targetH2KgPerDay}
                        onChange={handleProductionChange}
                        step={100}
                        unit="kg/day"
                        error={fieldError('systemCapacity')}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t.lcoh.derivedSystemCapacity}: {((params as ElectrolyzerParams).systemCapacity).toLocaleString()} kW
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.lcoh.capex}</label>
                    <CapexBreakdown
                      pathway={pathway}
                      capex={(params as ElectrolyzerParams).capex}
                      onCapexChange={(v) => setField('capex', v)}
                      lang={lang}
                      t={t}
                    />
                    {fieldError('capex') && (
                      <p className="mt-1 text-xs text-red-500">{fieldError('capex')}</p>
                    )}
                  </div>

                  <NumInput
                    label={t.lcoh.electricityCost}
                    value={(params as ElectrolyzerParams).electricityCost}
                    onChange={(v) => setField('electricityCost', v)}
                    step={0.01}
                    unit="$/kWh"
                    error={fieldError('electricityCost')}
                  />
                  <NumInput
                    label={t.lcoh.lifetime}
                    value={(params as ElectrolyzerParams).lifetime}
                    onChange={(v) => setField('lifetime', v)}
                    step={1}
                    min={5}
                    max={40}
                    unit="년"
                    error={fieldError('lifetime')}
                  />
                </div>

                {/* 전해조 고급 설정 토글 */}
                <button type="button" onClick={() => setShowAdvanced(v => !v)}
                  className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showAdvanced
                    ? (lang === 'ko' ? '고급 설정 접기' : 'Hide Advanced')
                    : (lang === 'ko' ? '고급 설정 (에너지 소비량, O&M율, 가동률)' : 'Advanced Settings (energy, O&M, capacity factor)')
                  }
                </button>

                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumInput
                      label={t.lcoh.energyConsumption}
                      value={(params as ElectrolyzerParams).energyConsumption}
                      onChange={(v) => setField('energyConsumption', v)}
                      step={1}
                      unit="kWh/kg H₂"
                      error={fieldError('energyConsumption')}
                    />
                    <NumInput
                      label={t.lcoh.opexRate}
                      value={(params as ElectrolyzerParams).opexRate * 100}
                      onChange={(v) => setField('opexRate', v / 100)}
                      step={0.5}
                      unit="%"
                      error={fieldError('opexRate')}
                    />
                    <NumInput
                      label={t.lcoh.capacityFactor}
                      value={(params as ElectrolyzerParams).capacityFactor * 100}
                      onChange={(v) => setField('capacityFactor', v / 100)}
                      step={1}
                      unit="%"
                      error={fieldError('capacityFactor')}
                    />
                  </div>
                )}
              </>
            )}

            {/* 계산 버튼 */}
            <button
              onClick={handleCalculate}
              className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {t.lcoh.calculate}
            </button>
          </div>

        </div>

        {/* 우: 결과 */}
        <div className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
          {result ? (
            <div ref={resultRef} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.result}</h2>
              </div>
              <div className="mb-4 pb-3 border-b border-gray-100">
                <CurrencySelector {...currencyCtx} />
              </div>

              {/* LCOH 메인 숫자 */}
              <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
                <div className="text-sm text-blue-600 mb-1">{t.lcoh.lcohResult}</div>
                <div className="text-4xl font-bold text-blue-700">
                  {currencyCtx.currencyInfo.symbol}{currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
                </div>
                <div className="text-sm text-blue-500 mt-1">{currencyCtx.currencyInfo.code}/kg H₂</div>
              </div>

              {/* 총 투자비 (전해조 경로만) */}
              {!isSmr && (() => {
                const elecP = params as ElectrolyzerParams
                const totalCapexUsd = elecP.systemCapacity * elecP.capex
                return (
                  <div className="mt-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">
                      {lang === 'ko' ? '총 설비 투자비 (Total CapEx)' : 'Total Capital Cost'}
                    </div>
                    <div className="text-lg font-bold text-slate-700">
                      {currencyCtx.currencyInfo.symbol}{(currencyCtx.convert(totalCapexUsd) / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-slate-400">
                      {elecP.systemCapacity.toLocaleString()} kW × {currencyCtx.currencyInfo.symbol}{currencyCtx.convert(elecP.capex).toFixed(0)}/kW
                    </div>
                  </div>
                )
              })()}

              {/* 연간 생산량 */}
              <div className="text-center text-sm text-gray-600 mb-4 mt-3">
                <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
                {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })} {t.lcoh.annualProductionUnit}
              </div>

              {/* 비용 구성 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <CostBadge label={t.lcoh.capexLabel} value={result.capexComponent} color="blue" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
                <CostBadge label={t.lcoh.opexLabel} value={result.opexComponent} color="amber" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
                <CostBadge label={t.lcoh.fuelLabel} value={result.fuelComponent} color="red" convert={currencyCtx.convert} currencyInfo={currencyCtx.currencyInfo} />
              </div>

              {/* 차트 */}
              <ResultChart result={result} t={t} />

              {/* 데이터 출처 */}
              <p className="mt-3 text-xs text-gray-400 text-right">
                {lang === 'ko'
                  ? '기본값 출처: IEA Global Hydrogen Review 2024 · IRENA 2024'
                  : 'Default values: IEA Global Hydrogen Review 2024 · IRENA 2024'}
              </p>
            </div>
          ) : (
            <div className="hidden lg:flex bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 items-center justify-center">
              <p className="text-sm text-gray-400 text-center whitespace-pre-line">
                {lang === 'ko' ? '파라미터를 입력하고\n계산 버튼을 누르세요' : 'Enter parameters and\nclick Calculate'}
              </p>
            </div>
          )}
        </div>
      </div>
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
  unit,
  error,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-stretch">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`flex-1 min-w-0 border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
            unit ? 'rounded-l-md rounded-r-none' : 'rounded-md'
          } ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
        />
        {unit && (
          <span className="inline-flex items-center px-2.5 text-xs text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function CostBadge({
  label,
  value,
  color,
  convert,
  currencyInfo,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'red'
  convert: (usdValue: number) => number
  currencyInfo: { symbol: string; decimals: number }
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  // 구성 항목은 소수점 3자리(USD) 또는 통화별 소수점에 맞춤
  const displayDecimals = currencyInfo.decimals === 0 ? 0 : 3
  return (
    <div className={`border rounded-lg p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-base font-bold sm:text-lg">
          {currencyInfo.symbol}{convert(value).toFixed(displayDecimals)}
          <span className="text-xs font-normal ml-0.5">/kg</span>
        </div>
      </div>
    </div>
  )
}
