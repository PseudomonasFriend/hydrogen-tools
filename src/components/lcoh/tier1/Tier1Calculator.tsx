'use client'

import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import PathwaySelector from '../PathwaySelector'
import { useTier1Calculation } from './useTier1Calculation'
import Tier1ParameterPanel from './Tier1ParameterPanel'
import Tier1ResultPanel from './Tier1ResultPanel'

interface Props {
  t: Translations
  lang: Lang
}

export default function Tier1Calculator({ t, lang }: Props) {
  const calc = useTier1Calculation()

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={calc.pathway} onChange={calc.handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* 좌: 파라미터 */}
        <Tier1ParameterPanel
          t={t}
          lang={lang}
          pathway={calc.pathway}
          params={calc.params}
          isSmr={calc.isSmr}
          capacityMode={calc.capacityMode}
          setCapacityMode={calc.setCapacityMode}
          showAdvanced={calc.showAdvanced}
          setShowAdvanced={calc.setShowAdvanced}
          targetH2KgPerDay={calc.targetH2KgPerDay}
          fieldError={calc.fieldError}
          setField={calc.setField}
          handleSystemCapacityChange={calc.handleSystemCapacityChange}
          handleProductionChange={calc.handleProductionChange}
          handlePresetSelect={calc.handlePresetSelect}
          handleReset={calc.handleReset}
          handleCalculate={calc.handleCalculate}
        />

        {/* 우: 결과 */}
        <div className="w-full lg:w-[45%] mt-4 lg:mt-0 lg:sticky lg:top-4">
          <Tier1ResultPanel
            t={t}
            lang={lang}
            result={calc.result}
            isSmr={calc.isSmr}
            params={calc.params}
            currencyCtx={calc.currencyCtx}
            resultRef={calc.resultRef}
          />
        </div>
      </div>
    </div>
  )
}
