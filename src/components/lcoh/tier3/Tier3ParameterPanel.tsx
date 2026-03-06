'use client'

import type { ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier3ExtraParams, PathwayId } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import CapexBreakdown from '../CapexBreakdown'
import SmrCapexBreakdown from '../SmrCapexBreakdown'

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

interface Props {
  t: Translations
  lang: Lang
  pathway: PathwayId
  params: ElectrolyzerParams | SmrParams
  t2Params: Tier2ExtraParams
  t3Params: Tier3ExtraParams
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
  setT3Field: (key: string, value: number) => void
  applyPreset: (presetId: string) => void
  handleReset: () => void
  handleCalculate: () => void
}

export default function Tier3ParameterPanel({
  t,
  lang,
  pathway,
  params,
  t2Params,
  t3Params,
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
  setT3Field,
  applyPreset,
  handleReset,
  handleCalculate,
}: Props) {
  return (
    <div className="w-full lg:w-[55%] space-y-4">

      {/* 헤더 (파라미터 타이틀 + 리셋) */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-700">{t.lcoh.params}</h2>
        <button onClick={handleReset} className="text-xs text-blue-600 hover:text-blue-800 underline">
          {t.lcoh.resetDefaults}
        </button>
      </div>

      {/* USD 입력 기준 안내 */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <p className="text-xs text-blue-600">{t.lcoh3.usdInputNotice}</p>
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
                  onChange={handleSystemCapacityChange}
                  step={100}
                  unit="kW"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t.lcoh.derivedDailyProduction}: {(() => { const ep = params as ElectrolyzerParams; const te = ep.energyConsumption + (ep.heatConsumption ?? 0); return te ? Math.round(ep.systemCapacity * ep.capacityFactor * 24 / te).toLocaleString() : '—'; })()} kg/day
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
        {!isSmr && pathway === 'soec' && (
          <>
            <NumInput
              label={t.lcoh.heatConsumption}
              value={(params as ElectrolyzerParams).heatConsumption ?? 0}
              onChange={(v) => setField('heatConsumption', v)}
              step={1}
              unit="kWh/kg H₂"
            />
            <NumInput
              label={t.lcoh.heatCost}
              value={(params as ElectrolyzerParams).heatCost ?? 0}
              onChange={(v) => setField('heatCost', v)}
              step={0.01}
              unit="$/kWh"
            />
          </>
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
  )
}
