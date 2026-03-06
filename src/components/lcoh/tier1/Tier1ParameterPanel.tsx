'use client'

import type { ElectrolyzerParams, SmrParams, PathwayId } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'
import CapexBreakdown from '../CapexBreakdown'
import SmrCapexBreakdown from '../SmrCapexBreakdown'

// ── NumInput ────────────────────────────────────────────────────────────────
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
  isSmr: boolean
  capacityMode: 'system' | 'production'
  setCapacityMode: (mode: 'system' | 'production') => void
  showAdvanced: boolean
  setShowAdvanced: (fn: (v: boolean) => boolean) => void
  targetH2KgPerDay: number
  fieldError: (field: string) => string | undefined
  setField: (key: string, value: number) => void
  handleSystemCapacityChange: (v: number) => void
  handleProductionChange: (kgPerDay: number) => void
  handlePresetSelect: (preset: (typeof REGIONAL_PRESETS)[number]) => void
  handleReset: () => void
  handleCalculate: () => void
}

export default function Tier1ParameterPanel({
  t,
  lang,
  pathway,
  params,
  isSmr,
  capacityMode,
  setCapacityMode,
  showAdvanced,
  setShowAdvanced,
  targetH2KgPerDay,
  fieldError,
  setField,
  handleSystemCapacityChange,
  handleProductionChange,
  handlePresetSelect,
  handleReset,
  handleCalculate,
}: Props) {
  return (
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

      {/* USD 입력 기준 안내 */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <p className="text-xs text-blue-600">{t.lcoh3.usdInputNotice}</p>
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
                    onChange={handleSystemCapacityChange}
                    step={100}
                    unit="kW"
                    error={fieldError('systemCapacity')}
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
                {pathway === 'soec' && (
                  <>
                    <NumInput
                      label={t.lcoh.heatConsumption}
                      value={(params as ElectrolyzerParams).heatConsumption ?? 0}
                      onChange={(v) => setField('heatConsumption', v)}
                      step={1}
                      unit="kWh/kg H₂"
                      error={fieldError('heatConsumption')}
                    />
                    <NumInput
                      label={t.lcoh.heatCost}
                      value={(params as ElectrolyzerParams).heatCost ?? 0}
                      onChange={(v) => setField('heatCost', v)}
                      step={0.01}
                      unit="$/kWh"
                      error={fieldError('heatCost')}
                    />
                  </>
                )}
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
  )
}
