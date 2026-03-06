'use client'

import { useState, useRef } from 'react'
import type {
  PathwayId,
  ElectrolyzerParams,
  SmrParams,
  Tier2ExtraParams,
  Tier3ExtraParams,
  Tier3Result,
  BreakEvenResult,
} from '@/lib/lcoh/types'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA, DEFAULT_T3_EXTRA } from '@/lib/lcoh/pathways'
import { calcTier3, calcBreakEven } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import { useCurrency } from '@/hooks/useCurrency'
import { REGIONAL_PRESETS } from '@/lib/lcoh/presets'

const SMR_PATHWAYS: PathwayId[] = ['smr', 'smr_ccs', 'atr_ccs', 'coal']

export function isSmrPathway(id: PathwayId): boolean {
  return SMR_PATHWAYS.includes(id)
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

export function useTier3Calculation() {
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

  const handleSystemCapacityChange = (v: number) => {
    setField('systemCapacity', v)
    const elecP = params as ElectrolyzerParams
    if (elecP.energyConsumption) {
      setTargetH2KgPerDay(Math.round(v * elecP.capacityFactor * 24 / elecP.energyConsumption))
    }
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

  // 지역 프리셋 적용
  const applyPreset = (presetId: string) => {
    const preset = REGIONAL_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    if (isSmrPathway(pathway)) {
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

  const isSmr = isSmrPathway(pathway)

  return {
    pathway,
    params,
    t2Params,
    t3Params,
    result,
    breakEvenResult,
    capacityMode,
    setCapacityMode,
    targetH2KgPerDay,
    isStale,
    openGroups,
    currencyCtx,
    resultRef,
    toggleGroup,
    handlePathwayChange,
    handleReset,
    handleCalculate,
    setField,
    handleSystemCapacityChange,
    handleProductionChange,
    setT2Field,
    setT3Field,
    applyPreset,
    isSmr,
  }
}
