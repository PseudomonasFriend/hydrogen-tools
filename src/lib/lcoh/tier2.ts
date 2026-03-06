import type {
  ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier2Result,
  SensitivityPoint, PathwayParams,
} from './types'
import { calcElectrolyzerLCOH, calcSmrLCOH } from './tier1'

export function calcElectrolyzerLCOH_T2(p: ElectrolyzerParams, t2: Tier2ExtraParams): Tier2Result {
  const H2_annual = (p.systemCapacity * p.capacityFactor * 8760) / p.energyConsumption
  const capexTotal = p.systemCapacity * p.capex
  const opexAnnual = capexTotal * p.opexRate
  const fuelAnnual = H2_annual * p.electricityCost * p.energyConsumption

  let pvOpex = 0, pvFuel = 0, pvStackRepl = 0, pvH2 = 0

  for (let t = 1; t <= p.lifetime; t++) {
    const df = Math.pow(1 + t2.wacc, t)
    // 인플레이션 반영: 연도별 상승률 적용 (t=1이 첫 번째 운영 연도, 상승률은 t-1번 복리)
    const elecEsc = Math.pow(1 + (t2.electricityEscalation ?? 0) / 100, t - 1)
    const opexEsc = Math.pow(1 + (t2.opexEscalation ?? 0) / 100, t - 1)
    pvOpex += (opexAnnual * opexEsc) / df
    pvFuel += (fuelAnnual * elecEsc) / df
    pvH2 += H2_annual / df
    if (t2.stackReplacement && t % t2.stackReplacement.interval === 0 && t < p.lifetime) {
      pvStackRepl += (capexTotal * t2.stackReplacement.costRate) / df
    }
  }

  return {
    lcoh: (capexTotal + pvOpex + pvFuel + pvStackRepl) / pvH2,
    annualProduction: H2_annual,
    capexComponent: capexTotal / pvH2,
    opexComponent: pvOpex / pvH2,
    fuelComponent: pvFuel / pvH2,
    stackReplComponent: pvStackRepl / pvH2,
    tier1Lcoh: calcElectrolyzerLCOH(p).lcoh,
  }
}

export function calcSmrLCOH_T2(p: SmrParams, t2: Tier2ExtraParams): Tier2Result {
  const H2_annual = p.plantCapacity * 1000 * 365 * p.capacityFactor
  const capexTotal = p.capexPerTpd * p.plantCapacity
  const opexAnnual = capexTotal * p.opexRate
  // co2 비용: (kg CO₂/kg H₂) × ($/tonne CO₂) / 1000 (tonne 환산) = $/kg H₂
  const co2CostPerKg = (p.co2EmissionFactor ?? 0) * (t2.co2Price ?? 0) / 1000
  const fuelCostPerKg = (p.naturalGasCostPerKgH2 ?? 0) + (p.ccsCostPerKgH2 ?? 0) + (p.coalCostPerKgH2 ?? 0) + co2CostPerKg
  const fuelAnnual = H2_annual * fuelCostPerKg

  let pvOpex = 0, pvFuel = 0, pvH2 = 0

  for (let t = 1; t <= p.lifetime; t++) {
    const df = Math.pow(1 + t2.wacc, t)
    // 인플레이션 반영: 연도별 상승률 적용 (t=1이 첫 번째 운영 연도, 상승률은 t-1번 복리)
    const gasEsc = Math.pow(1 + (t2.gasEscalation ?? 0) / 100, t - 1)
    const opexEsc = Math.pow(1 + (t2.opexEscalation ?? 0) / 100, t - 1)
    pvOpex += (opexAnnual * opexEsc) / df
    pvFuel += (fuelAnnual * gasEsc) / df
    pvH2 += H2_annual / df
  }

  return {
    lcoh: (capexTotal + pvOpex + pvFuel) / pvH2,
    annualProduction: H2_annual,
    capexComponent: capexTotal / pvH2,
    opexComponent: pvOpex / pvH2,
    fuelComponent: pvFuel / pvH2,
    stackReplComponent: 0,
    tier1Lcoh: calcSmrLCOH(p).lcoh,
  }
}

export function calcSensitivity(
  params: PathwayParams,
  t2: Tier2ExtraParams,
  isSmr: boolean
): SensitivityPoint[] {
  const calcLcoh = (p: PathwayParams, extraT2?: Partial<Tier2ExtraParams>): number => {
    const newT2 = { ...t2, ...extraT2 }
    return isSmr
      ? calcSmrLCOH_T2(p as SmrParams, newT2).lcoh
      : calcElectrolyzerLCOH_T2(p as ElectrolyzerParams, newT2).lcoh
  }

  const baseLcoh = calcLcoh(params)
  const points: SensitivityPoint[] = []

  // WACC 민감도
  const waccLow = calcLcoh(params, { wacc: t2.wacc * 0.8 })
  const waccHigh = calcLcoh(params, { wacc: t2.wacc * 1.2 })
  points.push({ paramKey: 'wacc', lowLcoh: Math.min(waccLow, waccHigh), highLcoh: Math.max(waccLow, waccHigh), baseLcoh, swing: Math.abs(waccHigh - waccLow) })

  if (isSmr) {
    const p = params as SmrParams

    const capexLow = calcLcoh({ ...p, capexPerTpd: p.capexPerTpd * 0.8 })
    const capexHigh = calcLcoh({ ...p, capexPerTpd: p.capexPerTpd * 1.2 })
    points.push({ paramKey: 'capexPerTpd', lowLcoh: Math.min(capexLow, capexHigh), highLcoh: Math.max(capexLow, capexHigh), baseLcoh, swing: Math.abs(capexHigh - capexLow) })

    const fuelLow = calcLcoh({ ...p, naturalGasCostPerKgH2: p.naturalGasCostPerKgH2 * 0.8 })
    const fuelHigh = calcLcoh({ ...p, naturalGasCostPerKgH2: p.naturalGasCostPerKgH2 * 1.2 })
    points.push({ paramKey: 'naturalGasCostPerKgH2', lowLcoh: Math.min(fuelLow, fuelHigh), highLcoh: Math.max(fuelLow, fuelHigh), baseLcoh, swing: Math.abs(fuelHigh - fuelLow) })

    const cfA = calcLcoh({ ...p, capacityFactor: Math.min(p.capacityFactor * 1.2, 0.99) })
    const cfB = calcLcoh({ ...p, capacityFactor: p.capacityFactor * 0.8 })
    points.push({ paramKey: 'capacityFactor', lowLcoh: Math.min(cfA, cfB), highLcoh: Math.max(cfA, cfB), baseLcoh, swing: Math.abs(cfA - cfB) })

    const opexLow = calcLcoh({ ...p, opexRate: p.opexRate * 0.8 })
    const opexHigh = calcLcoh({ ...p, opexRate: p.opexRate * 1.2 })
    points.push({ paramKey: 'opexRate', lowLcoh: Math.min(opexLow, opexHigh), highLcoh: Math.max(opexLow, opexHigh), baseLcoh, swing: Math.abs(opexHigh - opexLow) })
  } else {
    const p = params as ElectrolyzerParams

    const capexLow = calcLcoh({ ...p, capex: p.capex * 0.8 })
    const capexHigh = calcLcoh({ ...p, capex: p.capex * 1.2 })
    points.push({ paramKey: 'capex', lowLcoh: Math.min(capexLow, capexHigh), highLcoh: Math.max(capexLow, capexHigh), baseLcoh, swing: Math.abs(capexHigh - capexLow) })

    const elecLow = calcLcoh({ ...p, electricityCost: p.electricityCost * 0.8 })
    const elecHigh = calcLcoh({ ...p, electricityCost: p.electricityCost * 1.2 })
    points.push({ paramKey: 'electricityCost', lowLcoh: Math.min(elecLow, elecHigh), highLcoh: Math.max(elecLow, elecHigh), baseLcoh, swing: Math.abs(elecHigh - elecLow) })

    const cfA = calcLcoh({ ...p, capacityFactor: Math.min(p.capacityFactor * 1.2, 0.99) })
    const cfB = calcLcoh({ ...p, capacityFactor: p.capacityFactor * 0.8 })
    points.push({ paramKey: 'capacityFactor', lowLcoh: Math.min(cfA, cfB), highLcoh: Math.max(cfA, cfB), baseLcoh, swing: Math.abs(cfA - cfB) })

    const energyLow = calcLcoh({ ...p, energyConsumption: p.energyConsumption * 0.8 })
    const energyHigh = calcLcoh({ ...p, energyConsumption: p.energyConsumption * 1.2 })
    points.push({ paramKey: 'energyConsumption', lowLcoh: Math.min(energyLow, energyHigh), highLcoh: Math.max(energyLow, energyHigh), baseLcoh, swing: Math.abs(energyHigh - energyLow) })

    const opexLow = calcLcoh({ ...p, opexRate: p.opexRate * 0.8 })
    const opexHigh = calcLcoh({ ...p, opexRate: p.opexRate * 1.2 })
    points.push({ paramKey: 'opexRate', lowLcoh: Math.min(opexLow, opexHigh), highLcoh: Math.max(opexLow, opexHigh), baseLcoh, swing: Math.abs(opexHigh - opexLow) })
  }

  return points.sort((a, b) => b.swing - a.swing)
}
