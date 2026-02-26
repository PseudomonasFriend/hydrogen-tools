'use client'

import { useState } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier3ExtraParams, Tier3Result, BreakEvenResult, Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA, DEFAULT_T3_EXTRA } from '@/lib/lcoh/pathways'
import { calcTier3, calcBreakEven } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import PathwaySelector from './PathwaySelector'
import CashFlowTable from './CashFlowTable'
import NpvChart from './NpvChart'

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

export default function Tier3Calculator({ t }: Props) {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [t2Params, setT2Params] = useState<Tier2ExtraParams>(initialState.t2Params)
  const [t3Params, setT3Params] = useState<Tier3ExtraParams>(initialState.t3Params)
  const [result, setResult] = useState<Tier3Result | null>(null)
  const [breakEvenResult, setBreakEvenResult] = useState<BreakEvenResult | null>(null)

  const storage = useLcohStorage()

  const handlePathwayChange = (id: PathwayId) => {
    storage.savePathway(id)
    setPathway(id)
    setParams(storage.loadParams(id, DEFAULT_PARAMS[id]))
    setT2Params(storage.loadT2(id, DEFAULT_T2_EXTRA[id]))
    setT3Params(storage.loadT3(id, DEFAULT_T3_EXTRA[id]))
    setResult(null)
    setBreakEvenResult(null)
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setT2Params(DEFAULT_T2_EXTRA[pathway])
    setT3Params(DEFAULT_T3_EXTRA[pathway])
    setResult(null)
    setBreakEvenResult(null)
  }

  const handleCalculate = () => {
    const smr = isSmrPathway(pathway)
    const res = calcTier3(params, t2Params, t3Params, smr)
    // 계산 성공 전 저장
    storage.saveParams(pathway, params)
    storage.saveT2(pathway, t2Params)
    storage.saveT3(pathway, t3Params)
    setResult(res)
    const be = calcBreakEven(params, t2Params, t3Params)
    setBreakEvenResult(be)
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
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
  }

  const setT3Field = (key: string, value: number) => {
    setT3Params((prev) => ({ ...prev, [key]: value }))
  }

  const isSmr = isSmrPathway(pathway)

  const scenarioLabel = (id: string): string => {
    if (id === 'optimistic') return t.lcoh3.optimistic
    if (id === 'conservative') return t.lcoh3.conservative
    return t.lcoh3.base
  }

  return (
    <div className="space-y-6">
      {/* 경로 선택 */}
      <PathwaySelector selected={pathway} onChange={handlePathwayChange} t={t} />

      {/* 파라미터 입력 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-600">{t.lcoh.params}</h2>
          <button onClick={handleReset} className="text-xs text-blue-600 hover:text-blue-800 underline">
            {t.lcoh.resetDefaults}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tier 1 파라미터 */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Tier 1 파라미터</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isSmr ? (
                <>
                  <NumInput label={t.lcoh.plantCapacity} value={(params as SmrParams).plantCapacity} onChange={(v) => setField('plantCapacity', v)} step={10} />
                  <NumInput label={t.lcoh.capexPerTpd} value={(params as SmrParams).capexPerTpd} onChange={(v) => setField('capexPerTpd', v)} step={100000} />
                  <NumInput label={t.lcoh.opexRate} value={(params as SmrParams).opexRate * 100} onChange={(v) => setField('opexRate', v / 100)} step={0.5} min={0} max={20} />
                  <NumInput label={t.lcoh.capacityFactor} value={(params as SmrParams).capacityFactor * 100} onChange={(v) => setField('capacityFactor', v / 100)} step={1} min={0} max={100} />
                  <div>
                    <NumInput label={t.lcoh.naturalGasCost} value={(params as SmrParams).naturalGasCostPerKgH2} onChange={(v) => setField('naturalGasCostPerKgH2', v)} step={0.1} />
                    <p className="text-xs text-gray-400 mt-1">※ $/MMBtu × 0.20 ≈ $/kg H₂</p>
                  </div>
                  {(pathway === 'smr_ccs' || pathway === 'atr_ccs') && (
                    <NumInput label={t.lcoh.ccsCost} value={(params as SmrParams).ccsCostPerKgH2 ?? 0} onChange={(v) => setField('ccsCostPerKgH2', v)} step={0.1} />
                  )}
                  {pathway === 'coal' && (
                    <NumInput label={t.lcoh.coalCost} value={(params as SmrParams).coalCostPerKgH2 ?? 0} onChange={(v) => setField('coalCostPerKgH2', v)} step={0.05} />
                  )}
                  <NumInput label={t.lcoh.lifetime} value={(params as SmrParams).lifetime} onChange={(v) => setField('lifetime', v)} step={1} min={5} max={40} />
                </>
              ) : (
                <>
                  <NumInput label={t.lcoh.systemCapacity} value={(params as ElectrolyzerParams).systemCapacity} onChange={(v) => setField('systemCapacity', v)} step={100} />
                  <NumInput label={t.lcoh.capex} value={(params as ElectrolyzerParams).capex} onChange={(v) => setField('capex', v)} step={50} />
                  <NumInput label={t.lcoh.opexRate} value={(params as ElectrolyzerParams).opexRate * 100} onChange={(v) => setField('opexRate', v / 100)} step={0.5} min={0} max={20} />
                  <NumInput label={t.lcoh.capacityFactor} value={(params as ElectrolyzerParams).capacityFactor * 100} onChange={(v) => setField('capacityFactor', v / 100)} step={1} min={0} max={100} />
                  <NumInput label={t.lcoh.energyConsumption} value={(params as ElectrolyzerParams).energyConsumption} onChange={(v) => setField('energyConsumption', v)} step={1} />
                  <NumInput label={t.lcoh.electricityCost} value={(params as ElectrolyzerParams).electricityCost} onChange={(v) => setField('electricityCost', v)} step={0.01} />
                  <NumInput label={t.lcoh.lifetime} value={(params as ElectrolyzerParams).lifetime} onChange={(v) => setField('lifetime', v)} step={1} min={5} max={40} />
                </>
              )}
            </div>
          </div>

          {/* Tier 2 파라미터 */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Tier 2 파라미터</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumInput label={t.lcoh2.wacc} value={t2Params.wacc * 100} onChange={(v) => setT2Field('wacc', v / 100)} step={0.5} min={0} max={30} />
              {!isSmr && t2Params.stackReplacement && (
                <>
                  <NumInput label={t.lcoh2.stackReplCost} value={t2Params.stackReplacement.costRate * 100} onChange={(v) => setT2Field('stackReplCostRate', v / 100)} step={1} min={0} max={100} />
                  <NumInput label={t.lcoh2.stackReplInterval} value={t2Params.stackReplacement.interval} onChange={(v) => setT2Field('stackReplInterval', v)} step={1} min={1} max={30} />
                </>
              )}
            </div>
          </div>

          {/* Tier 3 파라미터 */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Tier 3 파라미터</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumInput label={t.lcoh3.h2SellingPrice} value={t3Params.h2SellingPrice} onChange={(v) => setT3Field('h2SellingPrice', v)} step={0.5} min={0} />
              <NumInput label={t.lcoh3.subsidyPerKgH2} value={t3Params.subsidyPerKgH2} onChange={(v) => setT3Field('subsidyPerKgH2', v)} step={0.1} min={0} max={10} />
              <NumInput
                label={t.lcoh3.subsidyDurationYears}
                value={t3Params.subsidyDurationYears}
                onChange={(v) => setT3Field('subsidyDurationYears', v)}
                step={1}
                min={0}
                max={30}
              />
              <NumInput label={t.lcoh3.taxRate} value={t3Params.taxRate * 100} onChange={(v) => setT3Field('taxRate', v / 100)} step={1} min={0} max={50} />
              <NumInput label={t.lcoh3.depreciationYears} value={t3Params.depreciationYears} onChange={(v) => setT3Field('depreciationYears', v)} step={1} min={1} max={30} />
              <div>
                <NumInput label={t.lcoh3.constructionYears} value={t3Params.constructionYears} onChange={(v) => setT3Field('constructionYears', v)} step={1} min={1} max={5} />
                {t3Params.constructionYears > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {t.lcoh3.constructionNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {t.lcoh3.calculate}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <>
          {/* 투자 요약 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh3.summary}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <SummaryCard
                label={t.lcoh3.npv}
                value={`$${(result.npv / 1_000_000).toFixed(2)}M`}
                positive={result.npv >= 0}
              />
              <SummaryCard
                label={t.lcoh3.irr}
                value={`${(result.irr * 100).toFixed(1)}%`}
                positive={result.irr > t2Params.wacc}
              />
              <SummaryCard
                label={t.lcoh3.paybackYear}
                value={result.paybackYear !== null ? `${result.paybackYear} ${t.lcoh3.paybackYearUnit}` : t.lcoh3.paybackNever}
                positive={result.paybackYear !== null}
              />
              <SummaryCard
                label={t.lcoh3.lcohRef}
                value={`$${result.lcoh.toFixed(2)}/kg`}
                positive={result.lcoh < t3Params.h2SellingPrice}
              />
              {breakEvenResult && (
                <SummaryCard
                  label={t.lcoh3.breakEvenPrice}
                  value={`$${breakEvenResult.breakEvenPrice.toFixed(2)}/kg`}
                  positive={breakEvenResult.margin >= 0}
                  subLabel={breakEvenResult.margin >= 0 ? t.lcoh3.breakEvenPositive : t.lcoh3.breakEvenNegative}
                  subValue={`${breakEvenResult.margin >= 0 ? '+' : ''}$${breakEvenResult.margin.toFixed(2)}`}
                />
              )}
            </div>
          </div>

          {/* 시나리오 비교 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh3.scenarioComparison}</h2>
            <div className="grid grid-cols-3 gap-3">
              {result.scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`border rounded-lg p-4 text-center ${
                    s.id === 'base' ? 'border-blue-300 bg-blue-50' :
                    s.id === 'optimistic' ? 'border-green-300 bg-green-50' :
                    'border-amber-300 bg-amber-50'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-2">{scenarioLabel(s.id)}</div>
                  <div className={`text-lg font-bold ${s.npv >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ${(s.npv / 1_000_000).toFixed(2)}M
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    IRR {(s.irr * 100).toFixed(1)}% · {s.paybackYear !== null ? `${s.paybackYear}${t.lcoh3.paybackYearUnit}` : t.lcoh3.paybackNever}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPV 곡선 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh3.npvChart}</h2>
            <NpvChart cashFlows={result.cashFlows} t={t} paybackYear={result.paybackYear} />
          </div>

          {/* 현금흐름 테이블 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh3.cashFlowTable}</h2>
            <CashFlowTable cashFlows={result.cashFlows} t={t} />
          </div>
        </>
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
