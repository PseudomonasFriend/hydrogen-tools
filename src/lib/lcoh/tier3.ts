import type {
  ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier3ExtraParams,
  Tier3Result, Tier3Scenario, CashFlowRow, ScenarioId, BreakEvenResult, PathwayParams,
} from './types'
import { isSmrParams } from './types'
import { calcElectrolyzerLCOH_T2, calcSmrLCOH_T2 } from './tier2'

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

/** 내부수익률 (IRR) — Newton-Raphson 방식. 수렴 실패 시 NaN 반환 */
export function calcIRR(cashFlows: number[], maxIter = 100, tolerance = 1e-7): number {
  // 부호 변화 없이 모두 음수거나 모두 양수면 IRR 존재 불가 → NaN
  const hasPositive = cashFlows.some(cf => cf > 0)
  const hasNegative = cashFlows.some(cf => cf < 0)
  if (!hasPositive || !hasNegative) return NaN

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
  // 수렴 실패 시 NaN 반환
  return NaN
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
  const baseCapex = p.systemCapacity * p.capex  // 기준 CapEx (시나리오 승수 미적용)
  const H2_annual = (p.systemCapacity * p.capacityFactor * 8760) / p.energyConsumption
  const opexAnnual = baseCapex * p.opexRate * scenario.opexMultiplier
  const fuelAnnual = H2_annual * p.electricityCost * p.energyConsumption * scenario.fuelMultiplier
  const annualDepreciation = capexTotal / t3.depreciationYears
  const wacc = t2.wacc
  const constructionYears = t3.constructionYears ?? 0
  // 보조금 기간: subsidyDurationYears 기본값은 lifetime 전체
  const subsidyDuration = t3.subsidyDurationYears ?? p.lifetime

  const rows: CashFlowRow[] = []
  let cumulativeCF = 0
  let cumulativePV = 0

  if (constructionYears <= 0) {
    // 건설기간 없음: Year 0에 전액 투자
    cumulativeCF = -capexTotal
    cumulativePV = -capexTotal
    rows.push({
      year: 0, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
      depreciation: 0, taxableIncome: 0, tax: 0,
      netCashFlow: -capexTotal, cumulativeCF,
      pvCashFlow: -capexTotal, cumulativePV,
    })
  } else {
    // 건설기간 동안 균등 분할 투자: Year -(constructionYears) ~ -1
    // PV 기준점: 운전 시작 시점(Year 0). 과거 현금흐름은 복리 계산으로 Year 0 시점 가치로 환산
    const annualCost = capexTotal / constructionYears
    for (let y = constructionYears; y >= 1; y--) {
      const yearNum = -y
      // 운전 시작(Year 0) 기준으로 y년 전에 지출 → PV = cost * (1+r)^y (복리 환산)
      const pvCF = -annualCost * Math.pow(1 + wacc, y)
      cumulativeCF -= annualCost
      cumulativePV += pvCF
      rows.push({
        year: yearNum, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
        depreciation: 0, taxableIncome: 0, tax: 0,
        netCashFlow: -annualCost, cumulativeCF,
        pvCashFlow: pvCF, cumulativePV,
      })
    }
  }

  // NOL 이월 (Net Operating Loss Carryforward) 추적
  let nolCarryforward = 0

  for (let t = 1; t <= p.lifetime; t++) {
    // 보조금은 subsidyDuration 이내 연도에만 적용
    const activeSubsidy = t <= subsidyDuration ? (t3.subsidyPerKgH2 ?? 0) : 0
    const revenue = H2_annual * (t3.h2SellingPrice * scenario.priceMultiplier + activeSubsidy)
    const stackRepl = (t2.stackReplacement && t % t2.stackReplacement.interval === 0 && t < p.lifetime)
      ? capexTotal * t2.stackReplacement.costRate
      : 0
    const dep = t <= t3.depreciationYears ? annualDepreciation : 0
    // NOL 이월 반영 세금 계산
    const grossTaxableIncome = revenue - opexAnnual - fuelAnnual - stackRepl - dep
    const taxableIncome = grossTaxableIncome - nolCarryforward
    let tax: number
    if (taxableIncome < 0) {
      nolCarryforward = Math.abs(taxableIncome)
      tax = 0
    } else {
      nolCarryforward = 0
      tax = taxableIncome * t3.taxRate
    }
    const netCF = revenue - opexAnnual - fuelAnnual - stackRepl - tax
    cumulativeCF += netCF
    // PV 할인: 운전 시작(Year 0) 기준으로 t년 후
    const pvCF = netCF / Math.pow(1 + wacc, t)
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
  const baseCapex = p.capexPerTpd * p.plantCapacity  // 기준 CapEx (시나리오 승수 미적용)
  const H2_annual = p.plantCapacity * 1000 * 365 * p.capacityFactor
  const opexAnnual = baseCapex * p.opexRate * scenario.opexMultiplier
  // co2 비용: (kg CO₂/kg H₂) × ($/tonne CO₂) / 1000 (tonne 환산) = $/kg H₂
  const co2CostPerKg = (p.co2EmissionFactor ?? 0) * (t2.co2Price ?? 0) / 1000
  const fuelCostPerKg = ((p.naturalGasCostPerKgH2 ?? 0) + (p.ccsCostPerKgH2 ?? 0) + (p.coalCostPerKgH2 ?? 0) + co2CostPerKg) * scenario.fuelMultiplier
  const fuelAnnual = H2_annual * fuelCostPerKg
  const annualDepreciation = capexTotal / t3.depreciationYears
  const wacc = t2.wacc
  const constructionYears = t3.constructionYears ?? 0
  // 보조금 기간: subsidyDurationYears 기본값은 lifetime 전체
  const subsidyDuration = t3.subsidyDurationYears ?? p.lifetime

  const rows: CashFlowRow[] = []
  let cumulativeCF = 0
  let cumulativePV = 0

  if (constructionYears <= 0) {
    // 건설기간 없음: Year 0에 전액 투자
    cumulativeCF = -capexTotal
    cumulativePV = -capexTotal
    rows.push({
      year: 0, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
      depreciation: 0, taxableIncome: 0, tax: 0,
      netCashFlow: -capexTotal, cumulativeCF,
      pvCashFlow: -capexTotal, cumulativePV,
    })
  } else {
    // 건설기간 동안 균등 분할 투자: Year -(constructionYears) ~ -1
    // PV 기준점: 운전 시작 시점(Year 0). 과거 현금흐름은 복리 계산으로 Year 0 시점 가치로 환산
    const annualCost = capexTotal / constructionYears
    for (let y = constructionYears; y >= 1; y--) {
      const yearNum = -y
      // 운전 시작(Year 0) 기준으로 y년 전에 지출 → PV = cost * (1+r)^y (복리 환산)
      const pvCF = -annualCost * Math.pow(1 + wacc, y)
      cumulativeCF -= annualCost
      cumulativePV += pvCF
      rows.push({
        year: yearNum, revenue: 0, opex: 0, fuel: 0, stackRepl: 0,
        depreciation: 0, taxableIncome: 0, tax: 0,
        netCashFlow: -annualCost, cumulativeCF,
        pvCashFlow: pvCF, cumulativePV,
      })
    }
  }

  // NOL 이월 (Net Operating Loss Carryforward) 추적
  let nolCarryforward = 0

  for (let t = 1; t <= p.lifetime; t++) {
    // 보조금은 subsidyDuration 이내 연도에만 적용
    const activeSubsidy = t <= subsidyDuration ? (t3.subsidyPerKgH2 ?? 0) : 0
    const revenue = H2_annual * (t3.h2SellingPrice * scenario.priceMultiplier + activeSubsidy)
    const dep = t <= t3.depreciationYears ? annualDepreciation : 0
    // NOL 이월 반영 세금 계산
    const grossTaxableIncome = revenue - opexAnnual - fuelAnnual - dep
    const taxableIncome = grossTaxableIncome - nolCarryforward
    let tax: number
    if (taxableIncome < 0) {
      nolCarryforward = Math.abs(taxableIncome)
      tax = 0
    } else {
      nolCarryforward = 0
      tax = taxableIncome * t3.taxRate
    }
    const netCF = revenue - opexAnnual - fuelAnnual - tax
    cumulativeCF += netCF
    // PV 할인: 운전 시작(Year 0) 기준으로 t년 후
    const pvCF = netCF / Math.pow(1 + wacc, t)
    cumulativePV += pvCF

    rows.push({
      year: t, revenue, opex: opexAnnual, fuel: fuelAnnual, stackRepl: 0,
      depreciation: dep, taxableIncome, tax, netCashFlow: netCF,
      cumulativeCF, pvCashFlow: pvCF, cumulativePV,
    })
  }
  return rows
}

/** Tier 3 전체 계산 (기준 시나리오 + 3개 시나리오 비교).
 *  isSmr가 생략되면 params 타입으로 자동 감지. */
export function calcTier3(
  params: PathwayParams,
  t2: Tier2ExtraParams,
  t3: Tier3ExtraParams,
  isSmr?: boolean
): Tier3Result {
  // isSmr가 명시되지 않으면 params 구조로 자동 판별
  const smr = isSmr !== undefined ? isSmr : isSmrParams(params)
  const baseScenario = SCENARIOS.find(s => s.id === 'base')!

  // 기준 시나리오 현금흐름
  const cashFlows = smr
    ? buildSmrCashFlows(params as SmrParams, t2, t3, baseScenario)
    : buildElectrolyzerCashFlows(params as ElectrolyzerParams, t2, t3, baseScenario)

  const rawCFs = cashFlows.map(r => r.netCashFlow)
  // NPV는 cumulativePV 마지막 값(= 모든 pvCashFlow의 합)으로 계산
  // calcNPV는 배열 인덱스 기반이라 건설기간이 있으면 오차가 생기므로 pvCashFlow 합산 사용
  const npv = cashFlows.reduce((sum, row) => sum + row.pvCashFlow, 0)
  const irr = calcIRR(rawCFs)

  // Tier 2 LCOH (참조용)
  const lcoh = smr
    ? calcSmrLCOH_T2(params as SmrParams, t2).lcoh
    : calcElectrolyzerLCOH_T2(params as ElectrolyzerParams, t2).lcoh

  // 3개 시나리오 비교
  const scenarios = SCENARIOS.map(scenario => {
    const scenarioCFs = smr
      ? buildSmrCashFlows(params as SmrParams, t2, t3, scenario)
      : buildElectrolyzerCashFlows(params as ElectrolyzerParams, t2, t3, scenario)
    const scenarioRawCFs = scenarioCFs.map(r => r.netCashFlow)
    return {
      id: scenario.id as ScenarioId,
      npv: scenarioCFs.reduce((sum, row) => sum + row.pvCashFlow, 0),
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

/** Break-even 분석: NPV=0이 되는 최소 H₂ 판매가 이진 탐색 */
export function calcBreakEven(
  params: ElectrolyzerParams | SmrParams,
  t2: Tier2ExtraParams,
  t3: Tier3ExtraParams
): BreakEvenResult {
  let low = 0
  let high = 50  // $/kg 최대 탐색 범위
  const tolerance = 0.001

  // NPV=0이 되는 판매가가 이 범위에 있는지 확인
  const testLow = calcTier3(params, t2, { ...t3, h2SellingPrice: low })
  const testHigh = calcTier3(params, t2, { ...t3, h2SellingPrice: high })

  // 둘 다 같은 부호면 범위 내에 해 없음 → 추정값 반환
  if ((testLow.npv < 0 && testHigh.npv < 0) || (testLow.npv > 0 && testHigh.npv > 0)) {
    const exceeded = testHigh.npv < 0  // $50에서도 NPV 음수 → 상한 초과
    return {
      breakEvenPrice: exceeded ? high : 0,
      margin: t3.h2SellingPrice - (exceeded ? high : 0),
      exceeded,
    }
  }

  while (high - low > tolerance) {
    const mid = (low + high) / 2
    const result = calcTier3(params, t2, { ...t3, h2SellingPrice: mid })
    if (result.npv > 0) high = mid
    else low = mid
  }

  const breakEvenPrice = (low + high) / 2
  return {
    breakEvenPrice,
    margin: t3.h2SellingPrice - breakEvenPrice,
    exceeded: false,
  }
}
