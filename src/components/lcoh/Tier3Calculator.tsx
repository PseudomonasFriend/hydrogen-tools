'use client'

import { useState, useRef } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier3ExtraParams, Tier3Result, BreakEvenResult, Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA, DEFAULT_T3_EXTRA } from '@/lib/lcoh/pathways'
import { calcTier3, calcBreakEven } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import { useCurrency } from '@/hooks/useCurrency'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import PathwaySelector from './PathwaySelector'
import CashFlowTable from './CashFlowTable'
import NpvChart from './NpvChart'
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

// 시나리오 가정 텍스트 (계산 로직에 고정된 값 반영)
const SCENARIO_ASSUMPTIONS: Record<string, { ko: string; en: string }> = {
  optimistic:   { ko: 'CapEx -15%, 판매가 +15%', en: 'CapEx -15%, Price +15%' },
  base:         { ko: '기준 시나리오 (기본값 적용)', en: 'Base scenario (default values)' },
  conservative: { ko: 'CapEx +15%, 판매가 -15%', en: 'CapEx +15%, Price -15%' },
}

function useInitialState() {
  const storage = useLcohStorage()
  const savedPathway = storage.loadPathway()
  if (savedPathway) {
    return {
      pathway: savedPathway,
      params: storage.loadParams(savedPathway, DEFAULT_PARAMS[savedPathway]),
      t2Params: storage.loadT2(savedPathway, DEFAULT_T2_EXTRA[savedPathway]),
      t3Params: storage.loadT3(savedPathway, DEFAULT_T3_EXTRA[savedPathway]),
    }
  }
  return {
    pathway: 'pem' as PathwayId,
    params: DEFAULT_PARAMS['pem'] as ElectrolyzerParams,
    t2Params: DEFAULT_T2_EXTRA['pem'],
    t3Params: DEFAULT_T3_EXTRA['pem'],
  }
}

// Accordion 파라미터 그룹 컴포넌트
function ParamGroup({ id, label, open, onToggle, children }: {
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
        aria-expanded={open}
        aria-controls={`param-group-${id}`}
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
        <div
          id={`param-group-${id}`}
          className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default function Tier3Calculator({ t, lang }: Props) {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [t2Params, setT2Params] = useState<Tier2ExtraParams>(initialState.t2Params)
  const [t3Params, setT3Params] = useState<Tier3ExtraParams>(initialState.t3Params)
  const [result, setResult] = useState<Tier3Result | null>(null)
  const [breakEvenResult, setBreakEvenResult] = useState<BreakEvenResult | null>(null)
  const [capacityMode, setCapacityMode] = useState<'system' | 'production'>('production')
  const [targetH2KgPerDay, setTargetH2KgPerDay] = useState<number>(() => {
    const p = initialState.params as ElectrolyzerParams
    return Math.round(p.systemCapacity * p.capacityFactor * 24 / (p.energyConsumption || 52))
  })
  const [isStale, setIsStale] = useState(false)

  // Accordion 열림 상태 (5개 그룹)
  const [openGroups, setOpenGroups] = useState<string[]>(['revenue', 'capex', 'ops', 'finance', 'energy'])
  const toggleGroup = (id: string) =>
    setOpenGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  const storage = useLcohStorage()
  const currencyCtx = useCurrency()
  const resultRef = useRef<HTMLDivElement>(null)

  const handlePathwayChange = (id: PathwayId) => {
    storage.savePathway(id)
    setPathway(id)
    setParams(storage.loadParams(id, DEFAULT_PARAMS[id]))
    setT2Params(storage.loadT2(id, DEFAULT_T2_EXTRA[id]))
    setT3Params(storage.loadT3(id, DEFAULT_T3_EXTRA[id]))
    setResult(null)
    setBreakEvenResult(null)
    setIsStale(false)
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setT2Params(DEFAULT_T2_EXTRA[pathway])
    setT3Params(DEFAULT_T3_EXTRA[pathway])
    setResult(null)
    setBreakEvenResult(null)
    setIsStale(false)
  }

  const handleCalculate = () => {
    const smr = isSmrPathway(pathway)
    const res = calcTier3(params, t2Params, t3Params, smr)
    storage.saveParams(pathway, params)
    storage.saveT2(pathway, t2Params)
    storage.saveT3(pathway, t3Params)
    setResult(res)
    const be = calcBreakEven(params, t2Params, t3Params)
    setBreakEvenResult(be)
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
    setParams((prev) => ({ ...prev, systemCapacity: Math.round(derived) }))
    setIsStale(true)
  }

  const setT2Field = (key: string, value: number) => {
    if (key === 'stackReplCostRate' || key === 'stackReplInterval') {
      setT2Params((prev) => ({
        ...prev,
        stackReplacement: {
          costRate: key === 'stackReplCostRate' ? value : (prev.stackReplacement?.costRate ?? 0.25),
          interval: key === 'stackReplInterval' ? value : (prev.stackReplacement?.interval ?? 8),
        },
      }))
    } else {
      setT2Params((prev) => ({ ...prev, [key]: value }))
    }
    setIsStale(true)
  }

  const setT3Field = (key: string, value: number) => {
    setT3Params((prev) => ({ ...prev, [key]: value }))
    setIsStale(true)
  }

  const isSmr = isSmrPathway(pathway)

  const scenarioLabel = (id: string): string => {
    if (id === 'optimistic') return t.lcoh3.optimistic
    if (id === 'conservative') return t.lcoh3.conservative
    return t.lcoh3.base
  }

  // 지역 프리셋 적용
  const applyPreset = (presetId: string) => {
    const preset = REGIONAL_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    if (isSmr) {
      setParams((prev) => ({
        ...prev,
        naturalGasCostPerKgH2: preset.naturalGasCost,
        ...(pathway === 'coal' ? { coalCostPerKgH2: preset.coalCost } : {}),
      }))
    } else {
      setParams((prev) => ({ ...prev, electricityCost: preset.electricityCost }))
    }
    setIsStale(true)
  }

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* 좌: 파라미터 패널 */}
        <div className="w-full lg:w-[55%] space-y-4">

          {/* 헤더 (파라미터 타이틀 + 리셋) */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.params}</h2>
            <button onClick={handleReset} className="text-xs text-blue-600 hover:text-blue-800 underline">
              {t.lcoh.resetDefaults}
            </button>
          </div>

          {/* 지역 프리셋 카드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t.lcoh2.regionalPreset}
            </div>
            <div className="flex flex-wrap gap-2">
              {REGIONAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {lang === 'ko' ? preset.labelKo : preset.labelEn}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {isSmr
                ? (lang === 'ko' ? '가스/석탄 비용 반영' : 'Applies gas/coal cost')
                : (lang === 'ko' ? '전기 단가 반영' : 'Applies electricity cost')}
            </p>
          </div>

          {/* 그룹 A: 수익 가정 (Revenue) */}
          <ParamGroup
            id="revenue"
            label={lang === 'ko' ? '수익 가정 (Revenue)' : 'Revenue Assumptions'}
            open={openGroups.includes('revenue')}
            onToggle={() => toggleGroup('revenue')}
          >
            <NumInput
              label={t.lcoh3.h2SellingPrice}
              value={t3Params.h2SellingPrice}
              onChange={(v) => setT3Field('h2SellingPrice', v)}
              step={0.5}
              min={0}
              unit="$/kg H₂"
            />
            <NumInput
              label={t.lcoh3.subsidyPerKgH2}
              value={t3Params.subsidyPerKgH2}
              onChange={(v) => setT3Field('subsidyPerKgH2', v)}
              step={0.1}
              min={0}
              max={10}
              unit="$/kg H₂"
            />
            <NumInput
              label={t.lcoh3.subsidyDurationYears}
              value={t3Params.subsidyDurationYears}
              onChange={(v) => setT3Field('subsidyDurationYears', v)}
              step={1}
              min={0}
              max={30}
              unit={lang === 'ko' ? '년' : 'yr'}
            />
          </ParamGroup>

          {/* 그룹 B: 설비 투자 (CapEx) */}
          <ParamGroup
            id="capex"
            label={lang === 'ko' ? '설비 투자 (CapEx)' : 'Capital Investment'}
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
                  unit="tonne H₂/day"
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
                <NumInput
                  label={t.lcoh3.constructionYears}
                  value={t3Params.constructionYears}
                  onChange={(v) => setT3Field('constructionYears', v)}
                  step={1}
                  min={1}
                  max={5}
                  unit={lang === 'ko' ? '년' : 'yr'}
                />
                {t3Params.constructionYears > 0 && (
                  <p className="sm:col-span-2 text-xs text-blue-600">{t.lcoh3.constructionNote}</p>
                )}
              </>
            ) : (
              <>
                {/* 입력 기준 토글 */}
                <div className="sm:col-span-2 flex items-center gap-3 mb-1">
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
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t.lcoh.derivedDailyProduction}: {(params as ElectrolyzerParams).energyConsumption
                        ? Math.round((params as ElectrolyzerParams).systemCapacity * (params as ElectrolyzerParams).capacityFactor * 24 / (params as ElectrolyzerParams).energyConsumption).toLocaleString()
                        : '—'} kg/day
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
                <NumInput
                  label={t.lcoh3.constructionYears}
                  value={t3Params.constructionYears}
                  onChange={(v) => setT3Field('constructionYears', v)}
                  step={1}
                  min={1}
                  max={5}
                  unit={lang === 'ko' ? '년' : 'yr'}
                />
                {t3Params.constructionYears > 0 && (
                  <p className="sm:col-span-2 text-xs text-blue-600">{t.lcoh3.constructionNote}</p>
                )}
              </>
            )}
          </ParamGroup>

          {/* 그룹 C: 운영 조건 (Operations) */}
          <ParamGroup
            id="ops"
            label={lang === 'ko' ? '운영 조건 (Operations)' : 'Operating Conditions'}
            open={openGroups.includes('ops')}
            onToggle={() => toggleGroup('ops')}
          >
            <NumInput
              label={t.lcoh.capacityFactor}
              value={(params as ElectrolyzerParams).capacityFactor * 100}
              onChange={(v) => setField('capacityFactor', v / 100)}
              step={1}
              min={0}
              max={100}
              unit="%"
            />
            <NumInput
              label={t.lcoh.opexRate}
              value={(params as ElectrolyzerParams).opexRate * 100}
              onChange={(v) => setField('opexRate', v / 100)}
              step={0.5}
              min={0}
              max={20}
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

          {/* 그룹 D: 금융 조건 (Finance) */}
          <ParamGroup
            id="finance"
            label={lang === 'ko' ? '금융 조건 (Finance)' : 'Financial Parameters'}
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
            <NumInput
              label={t.lcoh3.taxRate}
              value={t3Params.taxRate * 100}
              onChange={(v) => setT3Field('taxRate', v / 100)}
              step={1}
              min={0}
              max={50}
              unit="%"
            />
            <NumInput
              label={t.lcoh3.depreciationYears}
              value={t3Params.depreciationYears}
              onChange={(v) => setT3Field('depreciationYears', v)}
              step={1}
              min={1}
              max={30}
              unit={lang === 'ko' ? '년' : 'yr'}
            />
          </ParamGroup>

          {/* 그룹 E: 에너지/연료 비용 (Energy) */}
          <ParamGroup
            id="energy"
            label={lang === 'ko' ? '에너지/연료 비용 (Energy)' : 'Energy & Fuel Costs'}
            open={openGroups.includes('energy')}
            onToggle={() => toggleGroup('energy')}
          >
            {isSmr ? (
              <>
                <div>
                  <NumInput
                    label={t.lcoh.naturalGasCost}
                    value={(params as SmrParams).naturalGasCostPerKgH2}
                    onChange={(v) => setField('naturalGasCostPerKgH2', v)}
                    step={0.1}
                    unit="$/kg H₂"
                  />
                  <p className="text-xs text-gray-400 mt-1">※ $/MMBtu × 0.15 ≈ $/kg H₂ (SMR)</p>
                </div>
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
                <NumInput
                  label={t.lcoh2.gasEscalation}
                  value={t2Params.gasEscalation}
                  onChange={(v) => setT2Field('gasEscalation', v)}
                  step={0.5}
                  min={-5}
                  max={15}
                  unit={t.lcoh2.escalationUnit}
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
              </>
            )}
            <NumInput
              label={t.lcoh2.opexEscalation}
              value={t2Params.opexEscalation}
              onChange={(v) => setT2Field('opexEscalation', v)}
              step={0.5}
              min={-5}
              max={15}
              unit={t.lcoh2.escalationUnit}
            />
          </ParamGroup>

          {/* 계산 버튼 */}
          <button
            onClick={handleCalculate}
            className={`mt-1 w-full font-medium py-2.5 px-4 rounded-lg transition-all ${
              isStale
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isStale
              ? (lang === 'ko' ? '변경 사항 반영하여 재계산' : 'Recalculate')
              : t.lcoh3.calculate}
          </button>
        </div>

        {/* 우: 결과 패널 (sticky) */}
        <div className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
          {result ? (
            <div
              ref={resultRef}
              className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-opacity ${isStale ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* 투자 요약 헤더 */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">{t.lcoh3.summary}</h2>
              </div>
              <div className="mb-4 pb-3 border-b border-gray-100">
                <CurrencySelector {...currencyCtx} />
              </div>

              {/* KPI 카드 (2x3 그리드) */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <SummaryCard
                  label={t.lcoh3.npv}
                  value={`${currencyCtx.currencyInfo.symbol}${(currencyCtx.convert(result.npv) / 1_000_000).toFixed(2)}M`}
                  positive={result.npv >= 0}
                />
                <SummaryCard
                  label={t.lcoh3.irr}
                  value={isNaN(result.irr) ? (lang === 'ko' ? '수익성 없음' : 'N/A') : `${(result.irr * 100).toFixed(1)}%`}
                  positive={!isNaN(result.irr) && result.irr > t2Params.wacc}
                />
                <SummaryCard
                  label={t.lcoh3.paybackYear}
                  value={result.paybackYear !== null ? `${result.paybackYear} ${t.lcoh3.paybackYearUnit}` : t.lcoh3.paybackNever}
                  positive={result.paybackYear !== null}
                />
                <SummaryCard
                  label={t.lcoh3.lcohRef}
                  value={`${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(result.lcoh).toFixed(currencyCtx.currencyInfo.decimals)}/kg`}
                  positive={result.lcoh < t3Params.h2SellingPrice}
                />
                {breakEvenResult && (
                  <div className="col-span-2">
                    <SummaryCard
                      label={t.lcoh3.breakEvenPrice}
                      value={`${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(breakEvenResult.breakEvenPrice).toFixed(currencyCtx.currencyInfo.decimals)}/kg`}
                      positive={breakEvenResult.margin >= 0}
                      subLabel={breakEvenResult.margin >= 0 ? t.lcoh3.breakEvenPositive : t.lcoh3.breakEvenNegative}
                      subValue={`${breakEvenResult.margin >= 0 ? '+' : ''}${currencyCtx.currencyInfo.symbol}${currencyCtx.convert(Math.abs(breakEvenResult.margin)).toFixed(currencyCtx.currencyInfo.decimals)}`}
                    />
                  </div>
                )}
              </div>

              {/* 시나리오 비교 */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  {t.lcoh3.scenarioComparison}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {result.scenarios.map((s) => {
                    const isOpt = s.id === 'optimistic'
                    const isBase = s.id === 'base'
                    const assumption = SCENARIO_ASSUMPTIONS[s.id]

                    return (
                      <div
                        key={s.id}
                        className={`border rounded-xl p-4 ${
                          isOpt
                            ? 'border-green-300 bg-green-50'
                            : isBase
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-amber-300 bg-amber-50'
                        }`}
                      >
                        {/* 시나리오 이름 */}
                        <div className="text-xs font-semibold text-gray-600 mb-0.5">
                          {scenarioLabel(s.id)}
                        </div>
                        {/* 가정 텍스트 */}
                        <div className="text-xs text-gray-400 mb-3">
                          {lang === 'ko' ? assumption.ko : assumption.en}
                        </div>

                        {/* NPV */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-500">NPV</div>
                          <div className={`text-xl font-bold ${s.npv >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {currencyCtx.currencyInfo.symbol}{(currencyCtx.convert(s.npv) / 1_000_000).toFixed(2)}M
                          </div>
                        </div>

                        {/* IRR + 회수 기간 */}
                        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 mt-2">
                          <span>
                            IRR {isNaN(s.irr)
                              ? (lang === 'ko' ? '수익성 없음' : 'N/A')
                              : `${(s.irr * 100).toFixed(1)}%`}
                          </span>
                          <span>
                            {s.paybackYear !== null
                              ? `${s.paybackYear}${lang === 'ko' ? '년 회수' : 'yr payback'}`
                              : (lang === 'ko' ? '회수 불가' : 'No payback')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* NPV 곡선 */}
              <div className="mt-5">
                <h3 className="text-xs font-medium text-gray-600 mb-3">{t.lcoh3.npvChart}</h3>
                <NpvChart cashFlows={result.cashFlows} t={t} paybackYear={result.paybackYear} />
              </div>
            </div>
          ) : (
            /* 결과 없을 때 플레이스홀더 */
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <div className="text-gray-400 text-sm">
                {lang === 'ko'
                  ? '파라미터를 설정하고 계산을 실행하세요'
                  : 'Set parameters and run calculation'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 현금흐름 테이블 — 전체 너비 */}
      {result && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <CashFlowTable cashFlows={result.cashFlows} t={t} lang={lang} />
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

function SummaryCard({
  label,
  value,
  positive,
  subLabel,
  subValue,
}: {
  label: string
  value: string
  positive: boolean
  subLabel?: string
  subValue?: string
}) {
  return (
    <div className={`border rounded-lg p-3 text-center ${positive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive ? 'text-green-700' : 'text-red-600'}`}>{value}</div>
      {subLabel && (
        <div className={`text-xs mt-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>{subLabel}</div>
      )}
      {subValue && (
        <div className={`text-xs font-medium ${positive ? 'text-green-700' : 'text-red-600'}`}>{subValue}</div>
      )}
    </div>
  )
}
