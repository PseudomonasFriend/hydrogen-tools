'use client'

import { useState } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier2Result, SensitivityPoint } from '@/lib/lcoh/types'
import type { Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH_T2, calcSmrLCOH_T2, calcSensitivity } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import PathwaySelector from './PathwaySelector'
import ResultChart from './ResultChart'
import TornadoChart from './TornadoChart'
import CapexBreakdown from './CapexBreakdown'

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

export default function Tier2Calculator({ t, lang }: Props) {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [t2Params, setT2Params] = useState<Tier2ExtraParams>(initialState.t2Params)
  const [result, setResult] = useState<Tier2Result | null>(null)
  const [sensitivities, setSensitivities] = useState<SensitivityPoint[]>([])

  const storage = useLcohStorage()

  const handlePathwayChange = (id: PathwayId) => {
    storage.savePathway(id)
    setPathway(id)
    setParams(storage.loadParams(id, DEFAULT_PARAMS[id]))
    setT2Params(storage.loadT2(id, DEFAULT_T2_EXTRA[id]))
    setResult(null)
    setSensitivities([])
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setT2Params(DEFAULT_T2_EXTRA[pathway])
    setResult(null)
    setSensitivities([])
  }

  const handleCalculate = () => {
    const smr = isSmrPathway(pathway)
    const res = smr
      ? calcSmrLCOH_T2(params as SmrParams, t2Params)
      : calcElectrolyzerLCOH_T2(params as ElectrolyzerParams, t2Params)
    // 계산 성공 전 저장
    storage.saveParams(pathway, params)
    storage.saveT2(pathway, t2Params)
    setResult(res)
    setSensitivities(calcSensitivity(params, t2Params, smr))
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  // 실제 Tier2ExtraParams 키 + 스택 교체 전용 가상 키 처리
  const setT2Field = (key: keyof Tier2ExtraParams | 'stackReplCostRate' | 'stackReplInterval', value: number) => {
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

  const isSmr = isSmrPathway(pathway)

  // Tier1Result 호환 객체 (ResultChart 재사용)
  const tier1Compatible = result
    ? {
        lcoh: result.lcoh,
        annualProduction: result.annualProduction,
        capexComponent: result.capexComponent,
        opexComponent: result.opexComponent,
        fuelComponent: result.fuelComponent,
      }
    : null

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier 1 파라미터 (좌) */}
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.lcoh.capex}</label>
                    <CapexBreakdown
                      pathway={pathway}
                      capex={(params as ElectrolyzerParams).capex}
                      onCapexChange={(v) => setField('capex', v)}
                      lang={lang}
                      t={t}
                    />
                  </div>
                  <NumInput label={t.lcoh.opexRate} value={(params as ElectrolyzerParams).opexRate * 100} onChange={(v) => setField('opexRate', v / 100)} step={0.5} min={0} max={20} />
                  <NumInput label={t.lcoh.capacityFactor} value={(params as ElectrolyzerParams).capacityFactor * 100} onChange={(v) => setField('capacityFactor', v / 100)} step={1} min={0} max={100} />
                  <NumInput label={t.lcoh.energyConsumption} value={(params as ElectrolyzerParams).energyConsumption} onChange={(v) => setField('energyConsumption', v)} step={1} />
                  <NumInput label={t.lcoh.electricityCost} value={(params as ElectrolyzerParams).electricityCost} onChange={(v) => setField('electricityCost', v)} step={0.01} />
                  <NumInput label={t.lcoh.lifetime} value={(params as ElectrolyzerParams).lifetime} onChange={(v) => setField('lifetime', v)} step={1} min={5} max={40} />
                </>
              )}
            </div>
          </div>

          {/* Tier 2 추가 파라미터 (우) */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Tier 2 파라미터</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumInput
                label={t.lcoh2.wacc}
                value={t2Params.wacc * 100}
                onChange={(v) => setT2Field('wacc', v / 100)}
                step={0.5}
                min={0}
                max={30}
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
                  />
                  <NumInput
                    label={t.lcoh2.stackReplInterval}
                    value={t2Params.stackReplacement.interval}
                    onChange={(v) => setT2Field('stackReplInterval', v)}
                    step={1}
                    min={1}
                    max={30}
                  />
                </>
              )}
              {/* 인플레이션 / 에스컬레이션 입력 */}
              <NumInput
                label={t.lcoh2.electricityEscalation}
                value={t2Params.electricityEscalation}
                onChange={(v) => setT2Field('electricityEscalation', v)}
                step={0.5}
                min={-5}
                max={15}
                unit={t.lcoh2.escalationUnit}
              />
              {isSmr ? (
                <NumInput
                  label={t.lcoh2.gasEscalation}
                  value={t2Params.gasEscalation}
                  onChange={(v) => setT2Field('gasEscalation', v)}
                  step={0.5}
                  min={-5}
                  max={15}
                  unit={t.lcoh2.escalationUnit}
                />
              ) : null}
              <NumInput
                label={t.lcoh2.opexEscalation}
                value={t2Params.opexEscalation}
                onChange={(v) => setT2Field('opexEscalation', v)}
                step={0.5}
                min={-5}
                max={15}
                unit={t.lcoh2.escalationUnit}
              />
              {/* co2Price: SMR 계열만 표시 */}
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
            </div>
          </div>
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
        <>
          {/* Tier 1 vs Tier 2 비교 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-600 mb-4">{t.lcoh.result}</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">{t.lcoh2.tier1Compare}</div>
                <div className="text-3xl font-bold text-gray-600">${result.tier1Lcoh.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">{t.lcoh.unit}</div>
              </div>
              <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">{t.lcoh2.tier2Compare}</div>
                <div className="text-4xl font-bold text-blue-700">${result.lcoh.toFixed(2)}</div>
                <div className="text-xs text-blue-400 mt-1">{t.lcoh.unit}</div>
              </div>
            </div>

            {/* 연간 생산량 */}
            <div className="text-center text-sm text-gray-600 mb-4">
              <span className="font-medium">{t.lcoh.annualProductionLabel}: </span>
              {result.annualProduction.toLocaleString('en-US', { maximumFractionDigits: 0 })} {t.lcoh.annualProductionUnit}
            </div>

            {/* 비용 구성 배지 */}
            <div className={`grid gap-2 mb-4 ${!isSmr && result.stackReplComponent > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <CostBadge label={t.lcoh.capexLabel} value={result.capexComponent} color="blue" />
              <CostBadge label={t.lcoh.opexLabel} value={result.opexComponent} color="amber" />
              <CostBadge label={t.lcoh.fuelLabel} value={result.fuelComponent} color="red" />
              {!isSmr && result.stackReplComponent > 0 && (
                <CostBadge label={t.lcoh2.stackReplLabel} value={result.stackReplComponent} color="purple" />
              )}
            </div>

            {/* 차트 */}
            {tier1Compatible && <ResultChart result={tier1Compatible} t={t} />}
          </div>

          {/* 민감도 분석 */}
          {sensitivities.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-medium text-gray-600 mb-1">{t.lcoh2.sensitivity}</h2>
              <p className="text-xs text-gray-400 mb-4">{t.lcoh2.sensitivityDesc}</p>
              <TornadoChart sensitivities={sensitivities} t={t} />
            </div>
          )}
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
  unit,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {unit && <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>}
      </div>
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
  color: 'blue' | 'amber' | 'red' | 'purple'
}) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`border rounded-lg p-2 text-center ${colorMap[color]}`}>
      <div className="text-xs truncate mb-1">{label}</div>
      <div className="text-sm font-semibold">${value.toFixed(3)}</div>
    </div>
  )
}
