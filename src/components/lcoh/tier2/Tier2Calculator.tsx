'use client'

import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import PathwaySelector from '../PathwaySelector'
import { useTier2Calculation } from './useTier2Calculation'
import Tier2ParameterPanel from './Tier2ParameterPanel'
import Tier2ResultPanel, { Tier2SensitivityPanel } from './Tier2ResultPanel'

interface Props {
  t: Translations
  lang: Lang
}

export default function Tier2Calculator({ t, lang }: Props) {
  const calc = useTier2Calculation()

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={calc.pathway} onChange={calc.handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* 좌: 파라미터 패널 */}
        <Tier2ParameterPanel
          t={t}
          lang={lang}
          pathway={calc.pathway}
          params={calc.params}
          t2Params={calc.t2Params}
          isSmr={calc.isSmr}
          isStale={calc.isStale}
          capacityMode={calc.capacityMode}
          setCapacityMode={calc.setCapacityMode}
          targetH2KgPerDay={calc.targetH2KgPerDay}
          openGroups={calc.openGroups}
          toggleGroup={calc.toggleGroup}
          setField={calc.setField}
          handleSystemCapacityChange={calc.handleSystemCapacityChange}
          handleProductionChange={calc.handleProductionChange}
          setT2Field={calc.setT2Field}
          handlePresetSelect={calc.handlePresetSelect}
          handleReset={calc.handleReset}
          handleCalculate={calc.handleCalculate}
        />

        {/* 우: 결과 패널 + 민감도 차트 */}
        <Tier2ResultPanel
          t={t}
          lang={lang}
          result={calc.result}
          sensitivities={calc.sensitivities}
          isSmr={calc.isSmr}
          isStale={calc.isStale}
          tier1Compatible={calc.tier1Compatible}
          currencyCtx={calc.currencyCtx}
          resultRef={calc.resultRef}
        />
      </div>

      {/* 민감도 토네이도 차트 — 전체 너비 하단 */}
      {calc.result && (
        <Tier2SensitivityPanel
          t={t}
          lang={lang}
          sensitivities={calc.sensitivities}
          isStale={calc.isStale}
        />
      )}
    </div>
  )
}
