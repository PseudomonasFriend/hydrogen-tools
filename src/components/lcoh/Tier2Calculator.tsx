'use client'

import { useState, useRef } from 'react'
import type {
  PathwayId,
  ElectrolyzerParams,
  SmrParams,
  Tier2ExtraParams,
  Tier2Result,
  SensitivityPoint,
  Lang,
} from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH_T2, calcSmrLCOH_T2, calcSensitivity } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import { useCurrency } from '@/hooks/useCurrency'
import PathwaySelector from './PathwaySelector'
import ResultChart from './ResultChart'
import TornadoChart from './TornadoChart'
import CapexBreakdown from './CapexBreakdown'
import SmrCapexBreakdown from './SmrCapexBreakdown'
import CurrencySelector from '@/components/CurrencySelector'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import type { RegionalPreset } from '@/lib/lcoh/presets'

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
      t2Params: storage.loadT2(savedPathway, DEFAULT_T2_EXTRA[savedPathway]),
    }
  }
  return {
    pathway: 'pem' as PathwayId,
    params: DEFAULT_PARAMS['pem'] as ElectrolyzerParams,
    t2Params: DEFAULT_T2_EXTRA['pem'],
  }
}

// ── Accordion 파라미터 그룹 ──────────────────────────────────────────────────
function ParamGroup({
  label,
  open,
  onToggle,
  children,
}: {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── NumInput (unit 배지 형태) ──────────────────────────────────────────────────
function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  error,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  error?: string
  hint?: string
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
          } ${
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {unit && (
          <span className="inline-flex items-center px-2.5 text-xs text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── CostBadge ──────────────────────────────────────────────────────────────────
function CostBadge({
  label,
  value,
  color,
  convert,
  currencyInfo,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'red' | 'purple'
  convert: (usdValue: number) => number
  currencyInfo: { symbol: string; decimals: number; code: string }
}) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  const displayDecimals = currencyInfo.decimals === 0 ? 0 : 3
  return (
    <div className={`border rounded-lg p-2 text-center ${colorMap[color]}`}>
      <div className="text-xs truncate mb-1">{label}</div>
      <div className="text-sm font-semibold">
        {currencyInfo.symbol}{convert(value).toFixed(displayDecimals)}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function Tier2Calculator({ t, lang }: Props) {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [t2Params, setT2Params] = useState<Tier2ExtraParams>(initialState.t2Params)
  const [result, setResult] = useState<Tier2Result | null>(null)
  const [sensitivities, setSensitivities] = useState<SensitivityPoint[]>([])
  const [capacityMode, setCapacityMode] = useState<'system' | 'production'>('production')
  const [targetH2KgPerDay, setTargetH2KgPerDay] = useState<number>(() => {
    const p = initialState.params as ElectrolyzerParams
    return Math.round(p.systemCapacity * p.capacityFactor * 24 / (p.energyConsumption || 52))
  })
  const [isStale, setIsStale] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(['capex', 'ops', 'energy', 'finance'])

  const storage = useLcohStorage()
  const currencyCtx = useCurrency()
  const resultRef = useRef<HTMLDivElement>(null)

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )

  const handlePathwayChange = (id: PathwayId) => {
    storage.savePathway(id)
    setPathway(id)
    setParams(storage.loadParams(id, DEFAULT_PARAMS[id]))
    setT2Params(storage.loadT2(id, DEFAULT_T2_EXTRA[id]))
    setResult(null)
    setSensitivities([])
    setIsStale(false)
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setT2Params(DEFAULT_T2_EXTRA[pathway])
    setResult(null)
    setSensitivities([])
    setIsStale(false)
  }

  const handlePresetSelect = (preset: RegionalPreset) => {
    if (isSmrPathway(pathway)) {
      if (pathway === 'coal') {
        setParams((prev) => ({
          ...prev,
          naturalGasCostPerKgH2: preset.naturalGasCost,
          coalCostPerKgH2: preset.coalCost,
        }))
      } else {
        setParams((prev) => ({ ...prev, naturalGasCostPerKgH2: preset.naturalGasCost }))
      }
    } else {
      setParams((prev) => ({ ...prev, electricityCost: preset.electricityCost }))
    }
    setIsStale(true)
  }

  const handleCalculate = () => {
    const smr = isSmrPathway(pathway)
    const res = smr
      ? calcSmrLCOH_T2(params as SmrParams, t2Params)
      : calcElectrolyzerLCOH_T2(params as ElectrolyzerParams, t2Params)
    storage.saveParams(pathway, params)
    storage.saveT2(pathway, t2Params)
    setResult(res)
    setSensitivities(calcSensitivity(params, t2Params, smr))
    setIsStale(false)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
    setIsStale(true)
  }

  const handleProductionChange = (kgPerDay: number) => {
    setTargetH2KgPerDay(kgPerDay)
    const elecP = params as ElectrolyzerParams
    if (!elecP.capacityFactor || !elecP.energyConsumption) return
    const derived = kgPerDay * elecP.energyConsumption / (24 * elecP.capacityFactor)
    setField('systemCapacity', Math.round(derived))
  }

  const setT2Field = (
    key: keyof Tier2ExtraParams | 'stackReplCostRate' | 'stackReplInterval',
    value: number,
  ) => {
    if (key === 'stackReplCostRate' || key === 'stackReplInterval') {
      setT2Params((prev) => ({
        ...prev,
        stackReplacement: {
          costRate:
            key === 'stackReplCostRate' ? value : (prev.stackReplacement?.costRate ?? 0.25),
          interval:
            key === 'stackReplInterval' ? value : (prev.stackReplacement?.interval ?? 8),
        },
      }))
    } else {
      setT2Params((prev) => ({ ...prev, [key]: value }))
    }
    setIsStale(true)
  }

  const isSmr = isSmrPathway(pathway)

  const tier1Compatible = result
    ? {
        lcoh: result.lcoh,
        annualProduction: result.annualProduction,
        capexComponent: result.capexComponent,
        opexComponent: result.opexComponent,
        fuelComponent: result.fuelComponent,
      }
    : null

  const groupLabels = {
    capex:   lang === 'ko' ? '설비 투자 (CapEx)' : 'Capital Cost (CapEx)',
    ops:     lang === 'ko' ? '운영 조건' : 'Operations',
    energy:  lang === 'ko' ? '에너지 / 연료 비용' : 'Energy Cost',
    finance: lang === 'ko' ? '금융 조건' : 'Financial Conditions',
  }

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* ── 좌: 파라미터 패널 ─────────────────────────────────────── */}
        <div className="w-full lg:w-[55%] space-y-4">

          {/* 지역 에너지 가격 프리셋 카드 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-sm font-semibold text-slate-700">
                {lang === 'ko' ? '지역 에너지 가격 프리셋' : 'Regional Energy Preset'}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGIONAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="flex flex-col items-start px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <span className="text-xs font-semibold text-slate-700">
                    {lang === 'ko' ? preset.labelKo : preset.labelEn}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {isSmr
                      ? `가스 $${preset.naturalGasCost}/kg`
                      : `전기 $${preset.electricityCost}/kWh`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accordion 파라미터 그룹 헤더 */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.params}</h2>
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {t.lcoh.resetDefaults}
            </button>
          </div>

          <div className="space-y-2">
            {/* 그룹 A: 설비 투자 (CapEx) */}
            <ParamGroup
              id="capex"
              label={groupLabels.capex}
              open={openGroups.includes('capex')}
              onToggle={() => toggleGroup('capex')}
            >
              {isSmr ? (
                <>
                  <NumInput
                    label={t.lcoh.plantCapacity}
                    value={(params as SmrParams).plantCapacity}
                    onChange={(v) => setField('plantCapacity', v)}
                    step={10}
                    unit="t/day"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.lcoh.capexPerTpd}
                    </label>
                    <SmrCapexBreakdown
                      pathway={pathway}
                      capexPerTpd={(params as SmrParams).capexPerTpd}
                      onCapexChange={(v) => setField('capexPerTpd', v)}
                      lang={lang}
                      t={t}
                    />
                  </div>
                  <NumInput
                    label={t.lcoh.lifetime}
                    value={(params as SmrParams).lifetime}
                    onChange={(v) => setField('lifetime', v)}
                    step={1}
                    min={5}
                    max={40}
                    unit={lang === 'ko' ? '년' : 'yr'}
                  />
                </>
              ) : (
                <>
                  {/* 입력 기준 토글 */}
                  <div className="sm:col-span-2 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">
                      {t.lcoh.capacityMode}:
                    </span>
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

                  {capacityMode === 'system' ? (
                    <div>
                      <NumInput
                        label={t.lcoh.systemCapacity}
                        value={(params as ElectrolyzerParams).systemCapacity}
                        onChange={(v) => {
                          setField('systemCapacity', v)
                          const elecP = params as ElectrolyzerParams
                          if (elecP.energyConsumption) {
                            setTargetH2KgPerDay(
                              Math.round(
                                v * elecP.capacityFactor * 24 / elecP.energyConsumption,
                              ),
                            )
                          }
                        }}
                        step={100}
                        unit="kW"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t.lcoh.derivedDailyProduction}:{' '}
                        {(params as ElectrolyzerParams).energyConsumption
                          ? Math.round(
                              (params as ElectrolyzerParams).systemCapacity *
                                (params as ElectrolyzerParams).capacityFactor *
                                24 /
                                (params as ElectrolyzerParams).energyConsumption,
                            ).toLocaleString()
                          : '—'}{' '}
                        kg/day
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
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {t.lcoh.derivedSystemCapacity}:{' '}
                        {(params as ElectrolyzerParams).systemCapacity.toLocaleString()} kW
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.lcoh.capex}
                    </label>
                    <CapexBreakdown
                      pathway={pathway}
                      capex={(params as ElectrolyzerParams).capex}
                      onCapexChange={(v) => setField('capex', v)}
                      lang={lang}
                      t={t}
                    />
                  </div>

                  <NumInput
                    label={t.lcoh.lifetime}
                    value={(params as ElectrolyzerParams).lifetime}
                    onChange={(v) => setField('lifetime', v)}
                    step={1}
                    min={5}
                    max={40}
                    unit={lang === 'ko' ? '년' : 'yr'}
                  />
                </>
              )}
            </ParamGroup>

            {/* 그룹 B: 운영 조건 */}
            <ParamGroup
              id="ops"
              label={groupLabels.ops}
              open={openGroups.includes('ops')}
              onToggle={() => toggleGroup('ops')}
            >
              <NumInput
                label={t.lcoh.capacityFactor}
                value={
                  isSmr
                    ? (params as SmrParams).capacityFactor * 100
                    : (params as ElectrolyzerParams).capacityFactor * 100
                }
                onChange={(v) => setField('capacityFactor', v / 100)}
                step={1}
                min={0}
                max={100}
                unit="%"
              />
              {!isSmr && (
                <NumInput
                  label={t.lcoh.energyConsumption}
                  value={(params as ElectrolyzerParams).energyConsumption}
                  onChange={(v) => setField('energyConsumption', v)}
                  step={1}
                  unit="kWh/kg H₂"
                />
              )}
              <NumInput
                label={t.lcoh.opexRate}
                value={
                  isSmr
                    ? (params as SmrParams).opexRate * 100
                    : (params as ElectrolyzerParams).opexRate * 100
                }
                onChange={(v) => setField('opexRate', v / 100)}
                step={0.5}
                min={0}
                max={20}
                unit="%"
              />
              {!isSmr && t2Params.stackReplacement && (
                <>
                  <NumInput
                    label={t.lcoh2.stackReplCost}
                    value={t2Params.stackReplacement.costRate * 100}
                    onChange={(v) => setT2Field('stackReplCostRate', v / 100)}
                    step={1}
                    min={0}
                    max={100}
                    unit="%"
                  />
                  <NumInput
                    label={t.lcoh2.stackReplInterval}
                    value={t2Params.stackReplacement.interval}
                    onChange={(v) => setT2Field('stackReplInterval', v)}
                    step={1}
                    min={1}
                    max={30}
                    unit={lang === 'ko' ? '년' : 'yr'}
                  />
                </>
              )}
            </ParamGroup>

            {/* 그룹 C: 에너지 / 연료 비용 */}
            <ParamGroup
              id="energy"
              label={groupLabels.energy}
              open={openGroups.includes('energy')}
              onToggle={() => toggleGroup('energy')}
            >
              {isSmr ? (
                <>
                  <NumInput
                    label={t.lcoh.naturalGasCost}
                    value={(params as SmrParams).naturalGasCostPerKgH2}
                    onChange={(v) => setField('naturalGasCostPerKgH2', v)}
                    step={0.1}
                    unit="$/kg H₂"
                    hint="※ $/MMBtu × 0.15 ≈ $/kg H₂ (SMR, ~170 MJ/kg H₂ 기준)"
                  />
                  <NumInput
                    label={t.lcoh2.gasEscalation}
                    value={t2Params.gasEscalation}
                    onChange={(v) => setT2Field('gasEscalation', v)}
                    step={0.5}
                    min={-5}
                    max={15}
                    unit={t.lcoh2.escalationUnit}
                  />
                  <NumInput
                    label={t.lcoh2.opexEscalation}
                    value={t2Params.opexEscalation}
                    onChange={(v) => setT2Field('opexEscalation', v)}
                    step={0.5}
                    min={-5}
                    max={15}
                    unit={t.lcoh2.escalationUnit}
                  />
                  {(pathway === 'smr_ccs' || pathway === 'atr_ccs') && (
                    <NumInput
                      label={t.lcoh.ccsCost}
                      value={(params as SmrParams).ccsCostPerKgH2 ?? 0}
                      onChange={(v) => setField('ccsCostPerKgH2', v)}
                      step={0.1}
                      unit="$/kg H₂"
                    />
                  )}
                  {pathway === 'coal' && (
                    <NumInput
                      label={t.lcoh.coalCost}
                      value={(params as SmrParams).coalCostPerKgH2 ?? 0}
                      onChange={(v) => setField('coalCostPerKgH2', v)}
                      step={0.05}
                      unit="$/kg H₂"
                    />
                  )}
                </>
              ) : (
                <>
                  <NumInput
                    label={t.lcoh.electricityCost}
                    value={(params as ElectrolyzerParams).electricityCost}
                    onChange={(v) => setField('electricityCost', v)}
                    step={0.01}
                    unit="$/kWh"
                  />
                  <NumInput
                    label={t.lcoh2.electricityEscalation}
                    value={t2Params.electricityEscalation}
                    onChange={(v) => setT2Field('electricityEscalation', v)}
                    step={0.5}
                    min={-5}
                    max={15}
                    unit={t.lcoh2.escalationUnit}
                  />
                  <NumInput
                    label={t.lcoh2.opexEscalation}
                    value={t2Params.opexEscalation}
                    onChange={(v) => setT2Field('opexEscalation', v)}
                    step={0.5}
                    min={-5}
                    max={15}
                    unit={t.lcoh2.escalationUnit}
                  />
                </>
              )}
            </ParamGroup>

            {/* 그룹 D: 금융 조건 */}
            <ParamGroup
              id="finance"
              label={groupLabels.finance}
              open={openGroups.includes('finance')}
              onToggle={() => toggleGroup('finance')}
            >
              <NumInput
                label={t.lcoh2.wacc}
                value={t2Params.wacc * 100}
                onChange={(v) => setT2Field('wacc', v / 100)}
                step={0.5}
                min={0}
                max={30}
                unit="%"
              />
              {isSmr && (
                <NumInput
                  label={t.lcoh2.co2Price}
                  value={t2Params.co2Price ?? 0}
                  onChange={(v) => setT2Field('co2Price', v)}
                  step={5}
                  min={0}
                  max={300}
                  unit="$/tonne"
                />
              )}
            </ParamGroup>
          </div>

          {/* 계산 버튼 (stale 표시) */}
          <button
            onClick={handleCalculate}
            className={`w-full font-medium py-2.5 px-4 rounded-lg transition-all ${
              isStale
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isStale
              ? lang === 'ko'
                ? '변경 사항 반영하여 재계산'
                : 'Recalculate'
              : t.lcoh.calculate}
          </button>
        </div>

        {/* ── 우: 결과 패널 (sticky) ─────────────────────────────────── */}
        <div ref={resultRef} className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
          {result ? (
            <div className={`transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.result}</h2>
                </div>
                <div className="mb-4 pb-3 border-b border-gray-100">
                  <CurrencySelector {...currencyCtx} />
                </div>

                {/* Tier 1 vs Tier 2 비교 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">{t.lcoh2.tier1Compare}</div>
                    <div className="text-3xl font-bold text-gray-600">
                      {currencyCtx.currencyInfo.symbol}
                      {currencyCtx.convert(result.tier1Lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {currencyCtx.currencyInfo.code}/kg H₂
                    </div>
                  </div>
                  <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 mb-1">{t.lcoh2.tier2Compare}</div>
                    <div className="text-4xl font-bold text-blue-700">
                      {currencyCtx.currencyInfo.symbol}
                      {currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      {currencyCtx.currencyInfo.code}/kg H₂
                    </div>
                  </div>
                </div>

                {/* 연간 생산량 */}
                <div className="text-center text-sm text-gray-600 mb-4">
                  <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
                  {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                  {t.lcoh.annualProductionUnit}
                </div>

                {/* 비용 구성 배지 */}
                <div
                  className={`grid gap-2 mb-4 ${
                    !isSmr && result.stackReplComponent > 0 ? 'grid-cols-4' : 'grid-cols-3'
                  }`}
                >
                  <CostBadge
                    label={t.lcoh.capexLabel}
                    value={result.capexComponent}
                    color="blue"
                    convert={currencyCtx.convert}
                    currencyInfo={currencyCtx.currencyInfo}
                  />
                  <CostBadge
                    label={t.lcoh.opexLabel}
                    value={result.opexComponent}
                    color="amber"
                    convert={currencyCtx.convert}
                    currencyInfo={currencyCtx.currencyInfo}
                  />
                  <CostBadge
                    label={t.lcoh.fuelLabel}
                    value={result.fuelComponent}
                    color="red"
                    convert={currencyCtx.convert}
                    currencyInfo={currencyCtx.currencyInfo}
                  />
                  {!isSmr && result.stackReplComponent > 0 && (
                    <CostBadge
                      label={t.lcoh2.stackReplLabel}
                      value={result.stackReplComponent}
                      color="purple"
                      convert={currencyCtx.convert}
                      currencyInfo={currencyCtx.currencyInfo}
                    />
                  )}
                </div>

                {/* 비용 구성 차트 */}
                {tier1Compatible && <ResultChart result={tier1Compatible} t={t} />}
              </div>
            </div>
          ) : (
            /* 결과 없을 때 플레이스홀더 (데스크톱만 표시) */
            <div className="hidden lg:flex bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 items-center justify-center min-h-64">
              <p className="text-sm text-gray-400 text-center whitespace-pre-line">
                {lang === 'ko'
                  ? '파라미터를 입력하고\n계산 버튼을 누르세요'
                  : 'Enter parameters and\nclick Calculate'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 민감도 토네이도 차트 — 전체 너비 하단 ─────────────────────── */}
      {result && sensitivities.length > 0 && (
        <div className={`mt-4 transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-1">{t.lcoh2.sensitivity}</h2>
            <p className="text-xs text-gray-400 mb-4">{t.lcoh2.sensitivityDesc}</p>
            <TornadoChart sensitivities={sensitivities} t={t} lang={lang} />
          </div>
        </div>
      )}
    </div>
  )
}
