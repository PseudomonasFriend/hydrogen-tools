'use client'

import type { ElectrolyzerParams, SmrParams, Tier2ExtraParams, PathwayId } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import CapexBreakdown from '../CapexBreakdown'
import SmrCapexBreakdown from '../SmrCapexBreakdown'

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

// ── NumInput ──────────────────────────────────────────────────────────────────
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

interface Props {
  t: Translations
  lang: Lang
  pathway: PathwayId
  params: ElectrolyzerParams | SmrParams
  t2Params: Tier2ExtraParams
  isSmr: boolean
  isStale: boolean
  capacityMode: 'system' | 'production'
  setCapacityMode: (mode: 'system' | 'production') => void
  targetH2KgPerDay: number
  openGroups: string[]
  toggleGroup: (id: string) => void
  setField: (key: string, value: number) => void
  handleSystemCapacityChange: (v: number) => void
  handleProductionChange: (kgPerDay: number) => void
  setT2Field: (key: string, value: number) => void
  handlePresetSelect: (preset: (typeof REGIONAL_PRESETS)[number]) => void
  handleReset: () => void
  handleCalculate: () => void
}

export default function Tier2ParameterPanel({
  t,
  lang,
  pathway,
  params,
  t2Params,
  isSmr,
  isStale,
  capacityMode,
  setCapacityMode,
  targetH2KgPerDay,
  openGroups,
  toggleGroup,
  setField,
  handleSystemCapacityChange,
  handleProductionChange,
  setT2Field,
  handlePresetSelect,
  handleReset,
  handleCalculate,
}: Props) {
  const groupLabels = {
    capex:   lang === 'ko' ? '설비 투자 (CapEx)' : 'Capital Cost (CapEx)',
    ops:     lang === 'ko' ? '운영 조건' : 'Operations',
    energy:  lang === 'ko' ? '에너지 / 연료 비용' : 'Energy Cost',
    finance: lang === 'ko' ? '금융 조건' : 'Financial Conditions',
  }

  return (
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

      {/* USD 입력 기준 안내 */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <p className="text-xs text-blue-600">{t.lcoh3.usdInputNotice}</p>
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
                    onChange={handleSystemCapacityChange}
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
  )
}
