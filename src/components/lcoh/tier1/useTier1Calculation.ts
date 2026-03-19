'use client'

import { useState, useRef } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier1Result } from '@/lib/lcoh/types'
import { isSmrParams } from '@/lib/lcoh/types'
import { DEFAULT_PARAMS } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH, calcSmrLCOH } from '@/lib/lcoh/calculations'
import type { RegionalPreset } from '@/lib/lcoh/presets'
import { validateElectrolyzerParams, validateSmrParams } from '@/lib/lcoh/validation'
import type { ValidationError } from '@/lib/lcoh/validation'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import { useCurrency } from '@/hooks/useCurrency'
import { isSmrPathway } from '@/lib/lcoh/utils'

function useInitialState() {
  const storage = useLcohStorage()
  const savedPathway = storage.loadPathway()
  if (savedPathway) {
    return {
      pathway: savedPathway,
      params: storage.loadParams(savedPathway, DEFAULT_PARAMS[savedPathway]),
    }
  }
  return {
    pathway: 'pem' as PathwayId,
    params: DEFAULT_PARAMS['pem'] as ElectrolyzerParams,
  }
}

export function useTier1Calculation() {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [result, setResult] = useState<Tier1Result | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [capacityMode, setCapacityMode] = useState<'system' | 'production'>('production')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [targetH2KgPerDay, setTargetH2KgPerDay] = useState<number>(() => {
    const p = initialState.params as ElectrolyzerParams
    const totalEnergy = p.energyConsumption + (p.heatConsumption ?? 0)
    return Math.round(p.systemCapacity * p.capacityFactor * 24 / (totalEnergy || 52))
  })

  const storage = useLcohStorage()
  const currencyCtx = useCurrency()
  const resultRef = useRef<HTMLDivElement>(null)

  const handlePathwayChange = (newPathway: PathwayId) => {
    storage.savePathway(newPathway)
    setPathway(newPathway)
    setParams(storage.loadParams(newPathway, DEFAULT_PARAMS[newPathway]))
    setResult(null)
    setValidationErrors([])
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setResult(null)
    setValidationErrors([])
  }

  const handlePresetSelect = (preset: RegionalPreset) => {
    if (isSmrPathway(pathway)) {
      if (pathway === 'coal') {
        setParams((prev) => ({ ...prev, coalCostPerKgH2: preset.coalCost }))
      } else {
        setParams((prev) => ({ ...prev, naturalGasCostPerKgH2: preset.naturalGasCost }))
      }
    } else {
      setParams((prev) => ({ ...prev, electricityCost: preset.electricityCost }))
    }
  }

  const handleCalculate = () => {
    const errors = isSmrParams(params)
      ? validateSmrParams(params)
      : validateElectrolyzerParams(params as ElectrolyzerParams)

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])

    // 계산 성공 전 저장
    storage.saveParams(pathway, params)

    if (isSmrPathway(pathway)) {
      setResult(calcSmrLCOH(params as SmrParams))
    } else {
      setResult(calcElectrolyzerLCOH(params as ElectrolyzerParams))
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const setField = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  // 설비용량 기준 모드: kW 입력 → targetH2KgPerDay 동기화
  const handleSystemCapacityChange = (v: number) => {
    setField('systemCapacity', v)
    const elecP = params as ElectrolyzerParams
    const totalEnergy = elecP.energyConsumption + (elecP.heatConsumption ?? 0)
    if (totalEnergy) {
      setTargetH2KgPerDay(Math.round(v * elecP.capacityFactor * 24 / totalEnergy))
    }
  }

  // 생산량 기준 모드: kg/day 입력 → systemCapacity 역산
  const handleProductionChange = (kgPerDay: number) => {
    setTargetH2KgPerDay(kgPerDay)
    const elecP = params as ElectrolyzerParams
    if (!elecP.capacityFactor || !elecP.energyConsumption) return
    const totalEnergy = elecP.energyConsumption + (elecP.heatConsumption ?? 0)
    const derived = kgPerDay * totalEnergy / (24 * elecP.capacityFactor)
    setField('systemCapacity', Math.round(derived))
  }

  // 에러 있는 필드 확인 헬퍼
  const fieldError = (field: string) =>
    validationErrors.find((e) => e.field === field)?.message

  return {
    pathway,
    params,
    result,
    validationErrors,
    capacityMode,
    setCapacityMode,
    showAdvanced,
    setShowAdvanced,
    targetH2KgPerDay,
    currencyCtx,
    resultRef,
    handlePathwayChange,
    handleReset,
    handlePresetSelect,
    handleCalculate,
    setField,
    handleSystemCapacityChange,
    handleProductionChange,
    fieldError,
    isSmr: isSmrPathway(pathway),
  }
}
