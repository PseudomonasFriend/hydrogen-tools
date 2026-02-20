import type {
  ElectrolyzerParams, SmrParams, Tier1Result, Tier2ExtraParams, Tier2Result,
  SensitivityPoint, PathwayParams, Tier3ExtraParams, Tier3Result, Tier3Scenario,
  CashFlowRow, ScenarioId
} from './types'

export function calcElectrolyzerLCOH(p: ElectrolyzerParams): Tier1Result {
  // 연간 H₂ 생산량 (kg/year)
  const H2_annual = (p.systemCapacity * p.capacityFactor * 8760) / p.energyConsumption

  // 총 CapEx ($)
  const capexTotal = p.systemCapacity * p.capex

  // 연간 O&M 비용 ($)
  const opexAnnual = capexTotal * p.opexRate

  // 연간 연료(전기) 비용 ($)
  const fuelAnnual = H2_annual * p.electricityCost * p.energyConsumption

  // 수명 기간 총 생산량 (kg)
  const totalLifetimeH2 = H2_annual * p.lifetime

  // LCOH 구성요소 ($/kg H₂)
  const capexComponent = capexTotal / totalLifetimeH2
  const opexComponent = (opexAnnual * p.lifetime) / totalLifetimeH2
  const fuelComponent = (fuelAnnual * p.lifetime) / totalLifetimeH2

  return {
    lcoh: capexComponent + opexComponent + fuelComponent,
    annualProduction: H2_annual,
    capexComponent,
    opexComponent,
    fuelComponent,
  }
}

export function calcSmrLCOH(p: SmrParams): Tier1Result {
  // 연간 H₂ 생산량 (kg/year)
  const H2_annual = p.plantCapacity * 1000 * 365 * p.capacityFactor

  // 총 CapEx ($): capexPerTpd × plantCapacity
  const capexTotal = p.capexPerTpd * p.plantCapacity

  // 연간 O&M 비용 ($)
  const opexAnnual = capexTotal * p.opexRate

  // 연료비 단가 ($/kg H₂)
  const fuelCostPerKg =
    (p.naturalGasCostPerKgH2 ?? 0) +
    (p.ccsCostPerKgH2 ?? 0) +
    (p.coalCostPerKgH2 ?? 0)

  // 연간 연료비 ($)
  const fuelAnnual = H2_annual * fuelCostPerKg

  // 수명 기간 총 생산량 (kg)
  const totalLifetimeH2 = H2_annual * p.lifetime

  // LCOH 구성요소 ($/kg H₂)
  const capexComponent = capexTotal / totalLifetimeH2
  const opexComponent = (opexAnnual * p.lifetime) / totalLifetimeH2
  const fuelComponent = (fuelAnnual * p.lifetime) / totalLifetimeH2

  return {
    lcoh: capexComponent + opexComponent + fuelComponent,
    annualProduction: H2_annual,
    capexComponent,
    opexComponent,
    fuelComponent,
  }
}

export function calcElectrolyzerLCOH_T2(p: ElectrolyzerParams, t2: Tier2ExtraParams): Tier2Result {
  const H2_annual = (p.systemCapacity * p.capacityFactor * 8760) / p.energyConsumption
  const capexTotal = p.systemCapacity * p.capex
  const opexAnnual = capexTotal * p.opexRate
  const fuelAnnual = H2_annual * p.electricityCost * p.energyConsumption

  let pvOpex = 0, pvFuel = 0, pvStackRepl = 0, pvH2 = 0

  for (let t = 1; t <= p.lifetime; t++) {
    const df = Math.pow(1 + t2.wacc, t)
    pvOpex += opexAnnual / df
    pvFuel += fuelAnnual / df
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
  const fuelCostPerKg = (p.naturalGasCostPerKgH2 ?? 0) + (p.ccsCostPerKgH2 ?? 0) + (p.coalCostPerKgH2 ?? 0)
  const fuelAnnual = H2_annual * fuelCostPerKg

  let pvOpex = 0, pvFuel = 0, pvH2 = 0

  for (let t = 1; t <= p.lifetime; t++) {
    const df = Math.pow(1 + t2.wacc, t)
    pvOpex += opexAnnual / df
    pvFuel += fuelAnnual / df
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

// ── Tier 3: 연도별 현금흐름 분석 ──

const SCENARIOS: Tier3Scenario[] = [
  { id: 'optimistic',    capexMultiplier: 0.85, opexMultiplier: 0.85, fuelMultiplier: 0.85, priceMultiplier: 1.15 },
  { id: 'base',          capexMultiplier: 1.00, opexMultiplier: 1.00, fuelMultiplier: 1.00, priceMultiplier: 1.00 },
  { id: 'conservative',  capexMultiplier: 1.15, opexMultiplier: 1.15, fuelMultiplier: 1.15, priceMultiplier: 0.85 },
]

/** 순현재가치 (NPV) 계산 */
export function calcNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + discountRate, t), 0)
}

/** 내부수익률 (IRR) — Newton-Raphson 방식 */
export function calcIRR(cashFlows: number[], maxIter = 100, tolerance = 1e-7): number {
  let rate = 0.1 // 초기 추정치
  for (let i = 0; i < maxIter; i++) {
    let npv = 0
    let dNpv = 0
    for (let t = 0; t < cashFlows.length; t++) {
      const df = Math.pow(1 + rate, t)
      npv += cashFlows[t] / df
      if (t > 0) dNpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
    }
    if (Math.abs(npv) < tolerance) return rate
    if (Math.abs(dNpv) < 1e-15) break
    rate = rate - npv / dNpv
    if (rate < -0.99) rate = -0.5 // 발산 방지
  }
  return rate
}

/** 투자 회수 기간 (Payback Period) — 누적 현금흐름 기준 */
function calcPaybackYear(cashFlows: CashFlowRow[]): number | null {
  for (const row of cashFlows) {
    if (row.cumulativeCF >= 0) return row.year
  }
  return null
}

/** 전해조 경로 Tier 3 현금흐름 생성 */
function buildElectrolyzerCashFlows(
  p: ElectrolyzerParams,
  t2: Tier2ExtraParams,
  t3: Tier3ExtraParams,
  scenario: Tier3Scenario
): CashFlowRow[] {
  const capexTotal = p.systemCapacity * p.capex * scenario.capexMultiplier
  const H2_annual = (p.systemCapacity * p.capacityFactor * 8760) / p.energyConsumption
  const opexAnnual = capexTotal * p.opexRate * scenario.opexMultiplier
  const fuelAnnual = H2_annual * p.electricityCost * p.energyConsumption * scenario.fuelMultiplier
  const revenue = H2_annual * t3.h2SellingPrice * scenario.priceMultiplier
  const annualDepreciation = capexTotal / t3.depreciationYears

  const rows: CashFlowRow[] = []
  let cumulativeCF = -capexTotal  // 0년차: 초기 투자
  let cumulativePV = -capexTotal

  // 0년차 (건설/투자)
  rows.push({
    year: 0, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
    depreciation: 0, taxableIncome: 0, tax: 0,
    netCashFlow: -capexTotal, cumulativeCF,
    pvCashFlow: -capexTotal, cumulativePV,
  })

  for (let t = 1; t <= p.lifetime; t++) {
    const stackRepl = (t2.stackReplacement && t % t2.stackReplacement.interval === 0 && t < p.lifetime)
      ? capexTotal * t2.stackReplacement.costRate
      : 0
    const dep = t <= t3.depreciationYears ? annualDepreciation : 0
    const taxableIncome = revenue - opexAnnual - fuelAnnual - stackRepl - dep
    const tax = taxableIncome > 0 ? taxableIncome * t3.taxRate : 0
    const netCF = revenue - opexAnnual - fuelAnnual - stackRepl - tax
    cumulativeCF += netCF
    const pvCF = netCF / Math.pow(1 + t2.wacc, t)
    cumulativePV += pvCF

    rows.push({
      year: t, revenue, opex: opexAnnual, fuel: fuelAnnual, stackRepl,
      depreciation: dep, taxableIncome, tax, netCashFlow: netCF,
      cumulativeCF, pvCashFlow: pvCF, cumulativePV,
    })
  }
  return rows
}

/** SMR 경로 Tier 3 현금흐름 생성 */
function buildSmrCashFlows(
  p: SmrParams,
  t2: Tier2ExtraParams,
  t3: Tier3ExtraParams,
  scenario: Tier3Scenario
): CashFlowRow[] {
  const capexTotal = p.capexPerTpd * p.plantCapacity * scenario.capexMultiplier
  const H2_annual = p.plantCapacity * 1000 * 365 * p.capacityFactor
  const opexAnnual = capexTotal * p.opexRate * scenario.opexMultiplier
  const fuelCostPerKg = ((p.naturalGasCostPerKgH2 ?? 0) + (p.ccsCostPerKgH2 ?? 0) + (p.coalCostPerKgH2 ?? 0)) * scenario.fuelMultiplier
  const fuelAnnual = H2_annual * fuelCostPerKg
  const revenue = H2_annual * t3.h2SellingPrice * scenario.priceMultiplier
  const annualDepreciation = capexTotal / t3.depreciationYears

  const rows: CashFlowRow[] = []
  let cumulativeCF = -capexTotal
  let cumulativePV = -capexTotal

  rows.push({
    year: 0, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
    depreciation: 0, taxableIncome: 0, tax: 0,
    netCashFlow: -capexTotal, cumulativeCF,
    pvCashFlow: -capexTotal, cumulativePV,
  })

  for (let t = 1; t <= p.lifetime; t++) {
    const dep = t <= t3.depreciationYears ? annualDepreciation : 0
    const taxableIncome = revenue - opexAnnual - fuelAnnual - dep
    const tax = taxableIncome > 0 ? taxableIncome * t3.taxRate : 0
    const netCF = revenue - opexAnnual - fuelAnnual - tax
    cumulativeCF += netCF
    const pvCF = netCF / Math.pow(1 + t2.wacc, t)
    cumulativePV += pvCF

    rows.push({
      year: t, revenue, opex: opexAnnual, fuel: fuelAnnual, stackRepl: 0,
      depreciation: dep, taxableIncome, tax, netCashFlow: netCF,
      cumulativeCF, pvCashFlow: pvCF, cumulativePV,
    })
  }
  return rows
}

/** Tier 3 전체 계산 (기준 시나리오 + 3개 시나리오 비교) */
export function calcTier3(
  params: PathwayParams,
  t2: Tier2ExtraParams,
  t3: Tier3ExtraParams,
  isSmr: boolean
): Tier3Result {
  const baseScenario = SCENARIOS.find(s => s.id === 'base')!

  // 기준 시나리오 현금흐름
  const cashFlows = isSmr
    ? buildSmrCashFlows(params as SmrParams, t2, t3, baseScenario)
    : buildElectrolyzerCashFlows(params as ElectrolyzerParams, t2, t3, baseScenario)

  const rawCFs = cashFlows.map(r => r.netCashFlow)
  const npv = calcNPV(rawCFs, t2.wacc)
  const irr = calcIRR(rawCFs)

  // Tier 2 LCOH (참조용)
  const lcoh = isSmr
    ? calcSmrLCOH_T2(params as SmrParams, t2).lcoh
    : calcElectrolyzerLCOH_T2(params as ElectrolyzerParams, t2).lcoh

  // 3개 시나리오 비교
  const scenarios = SCENARIOS.map(scenario => {
    const scenarioCFs = isSmr
      ? buildSmrCashFlows(params as SmrParams, t2, t3, scenario)
      : buildElectrolyzerCashFlows(params as ElectrolyzerParams, t2, t3, scenario)
    const scenarioRawCFs = scenarioCFs.map(r => r.netCashFlow)
    return {
      id: scenario.id,
      npv: calcNPV(scenarioRawCFs, t2.wacc),
      irr: calcIRR(scenarioRawCFs),
      paybackYear: calcPaybackYear(scenarioCFs),
    }
  })

  return {
    cashFlows,
    npv,
    irr,
    paybackYear: calcPaybackYear(cashFlows),
    lcoh,
    scenarios,
  }
}
