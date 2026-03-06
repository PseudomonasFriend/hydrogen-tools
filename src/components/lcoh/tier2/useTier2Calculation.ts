'use client'

import { useState, useRef } from 'react'
import type {
  PathwayId,
  ElectrolyzerParams,
  SmrParams,
  Tier2ExtraParams,
  Tier2Result,
  SensitivityPoint,
} from '@/lib/lcoh/types'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA } from '@/lib/lcoh/pathways'
import { calcElectrolyzerLCOH_T2, calcSmrLCOH_T2, calcSensitivity } from '@/lib/lcoh/calculations'
import { useLcohStorage } from '@/hooks/useLcohStorage'
import { useCurrency } from '@/hooks/useCurrency'
import type { RegionalPreset } from '@/lib/lcoh/presets'

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
    }
  }
  return {
    pathway: 'pem' as PathwayId,
    params: DEFAULT_PARAMS['pem'] as ElectrolyzerParams,
    t2Params: DEFAULT_T2_EXTRA['pem'],
  }
}

export function useTier2Calculation() {
  const initialState = useInitialState()
  const [pathway, setPathway] = useState<PathwayId>(initialState.pathway)
  const [params, setParams] = useState<ElectrolyzerParams | SmrParams>(initialState.params)
  const [t2Params, setT2Params] = useState<Tier2ExtraParams>(initialState.t2Params)
  const [result, setResult] = useState<Tier2Result | null>(null)
  const [sensitivities, setSensitivities] = useState<SensitivityPoint[]>([])
  const [capacityMode, setCapacityMode] = useState<'system' | 'production'>('production')
  const [targetH2KgPerDay, setTargetH2KgPerDay] = useState<number>(() => {
    const p = initialState.params as ElectrolyzerParams
    return Math.round(p.systemCapacity * p.capacityFactor * 24 / (p.energyConsumption || 52))
  })
  const [isStale, setIsStale] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(['capex', 'ops', 'energy', 'finance'])

  const storage = useLcohStorage()
  const currencyCtx = useCurrency()
  const resultRef = useRef<HTMLDivElement>(null)

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )

  const handlePathwayChange = (id: PathwayId) => {
    storage.savePathway(id)
    setPathway(id)
    setParams(storage.loadParams(id, DEFAULT_PARAMS[id]))
    setT2Params(storage.loadT2(id, DEFAULT_T2_EXTRA[id]))
    setResult(null)
    setSensitivities([])
    setIsStale(false)
  }

  const handleReset = () => {
    setParams(DEFAULT_PARAMS[pathway])
    setT2Params(DEFAULT_T2_EXTRA[pathway])
    setResult(null)
    setSensitivities([])
    setIsStale(false)
  }

  const handlePresetSelect = (preset: RegionalPreset) => {
    if (isSmrPathway(pathway)) {
      if (pathway === 'coal') {
        setParams((prev) => ({
          ...prev,
          naturalGasCostPerKgH2: preset.naturalGasCost,
          coalCostPerKgH2: preset.coalCost,
        }))
      } else {
        setParams((prev) => ({ ...prev, naturalGasCostPerKgH2: preset.naturalGasCost }))
      }
    } else {
      setParams((prev) => ({ ...prev, electricityCost: preset.electricityCost }))
    }
    setIsStale(true)
  }

  const handleCalculate = () => {
    const smr = isSmrPathway(pathway)
    const res = smr
      ? calcSmrLCOH_T2(params as SmrParams, t2Params)
      : calcElectrolyzerLCOH_T2(params as ElectrolyzerParams, t2Params)
    storage.saveParams(pathway, params)
    storage.saveT2(pathway, t2Params)
    setResult(res)
    setSensitivities(calcSensitivity(params, t2Params, smr))
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
      setTargetH2KgPerDay(
        Math.round(v * elecP.capacityFactor * 24 / elecP.energyConsumption),
      )
    }
  }

  const handleProductionChange = (kgPerDay: number) => {
    setTargetH2KgPerDay(kgPerDay)
    const elecP = params as ElectrolyzerParams
    if (!elecP.capacityFactor || !elecP.energyConsumption) return
    const derived = kgPerDay * elecP.energyConsumption / (24 * elecP.capacityFactor)
    setField('systemCapacity', Math.round(derived))
  }

  const setT2Field = (
    key: string,
    value: number,
  ) => {
    if (key === 'stackReplCostRate' || key === 'stackReplInterval') {
      setT2Params((prev) => ({
        ...prev,
        stackReplacement: {
          costRate:
            key === 'stackReplCostRate' ? value : (prev.stackReplacement?.costRate ?? 0.25),
          interval:
            key === 'stackReplInterval' ? value : (prev.stackReplacement?.interval ?? 8),
        },
      }))
    } else {
      setT2Params((prev) => ({ ...prev, [key]: value }))
    }
    setIsStale(true)
  }

  const isSmr = isSmrPathway(pathway)

  const tier1Compatible = result
    ? {
        lcoh: result.lcoh,
        annualProduction: result.annualProduction,
        capexComponent: result.capexComponent,
        opexComponent: result.opexComponent,
        fuelComponent: result.fuelComponent,
      }
    : null

  return {
    pathway,
    params,
    t2Params,
    result,
    sensitivities,
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
    handlePresetSelect,
    handleCalculate,
    setField,
    handleSystemCapacityChange,
    handleProductionChange,
    setT2Field,
    isSmr,
    tier1Compatible,
  }
}
