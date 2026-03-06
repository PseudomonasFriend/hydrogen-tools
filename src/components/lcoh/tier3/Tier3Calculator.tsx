'use client'

import type { Translations } from '@/lib/i18n/ko'
import type { Lang } from '@/lib/lcoh/types'
import PathwaySelector from '../PathwaySelector'
import { useTier3Calculation } from './useTier3Calculation'
import Tier3ParameterPanel from './Tier3ParameterPanel'
import Tier3ResultPanel from './Tier3ResultPanel'
import CashFlowTable from '../CashFlowTable'

interface Props {
  t: Translations
  lang: Lang
}

export default function Tier3Calculator({ t, lang }: Props) {
  const calc = useTier3Calculation()

  return (
    <div className="space-y-4">
      {/* 경로 선택 */}
      <PathwaySelector selected={calc.pathway} onChange={calc.handlePathwayChange} t={t} lang={lang} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* 좌: 파라미터 패널 */}
        <Tier3ParameterPanel
          t={t}
          lang={lang}
          pathway={calc.pathway}
          params={calc.params}
          t2Params={calc.t2Params}
          t3Params={calc.t3Params}
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
          setT3Field={calc.setT3Field}
          applyPreset={calc.applyPreset}
          handleReset={calc.handleReset}
          handleCalculate={calc.handleCalculate}
        />

        {/* 우: 결과 패널 (sticky) */}
        <Tier3ResultPanel
          t={t}
          lang={lang}
          result={calc.result}
          breakEvenResult={calc.breakEvenResult}
          isStale={calc.isStale}
          t2Params={calc.t2Params}
          t3Params={calc.t3Params}
          currencyCtx={calc.currencyCtx}
          resultRef={calc.resultRef}
        />
      </div>

      {/* 현금흐름 테이블 — 전체 너비 */}
      {calc.result && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <CashFlowTable cashFlows={calc.result.cashFlows} t={t} lang={lang} />
        </div>
      )}
    </div>
  )
}
