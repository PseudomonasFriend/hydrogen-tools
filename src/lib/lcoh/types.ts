export type PathwayId = 'pem' | 'alk' | 'aem' | 'soec' | 'smr' | 'smr_ccs' | 'atr_ccs' | 'coal'
export type Lang = 'ko' | 'en'

export interface ElectrolyzerParams {
  systemCapacity: number    // kW
  capex: number             // $/kW
  opexRate: number          // fraction (0.04 = 4%)
  capacityFactor: number    // fraction (0.45 = 45%)
  energyConsumption: number // kWh/kg H₂
  electricityCost: number   // $/kWh
  lifetime: number          // years
}

export interface SmrParams {
  plantCapacity: number          // tonne H₂/day
  capexPerTpd: number            // $/tpd
  opexRate: number               // fraction
  capacityFactor: number         // fraction
  naturalGasCostPerKgH2: number  // $/kg H₂
  ccsCostPerKgH2?: number        // $/kg H₂ (optional)
  coalCostPerKgH2?: number       // $/kg H₂ (optional)
  lifetime: number               // years
  co2EmissionFactor?: number     // kg CO₂/kg H₂ (SMR/Coal/SMR_CCS/ATR_CCS 전용)
}

export type PathwayParams = ElectrolyzerParams | SmrParams

export interface Tier1Result {
  lcoh: number              // $/kg H₂
  annualProduction: number  // kg H₂/year
  capexComponent: number    // $/kg H₂
  opexComponent: number     // $/kg H₂
  fuelComponent: number     // $/kg H₂
}

export function isSmrParams(p: PathwayParams): p is SmrParams {
  return 'plantCapacity' in p
}

// Tier 2 추가 파라미터
export interface StackReplacement {
  costRate: number   // fraction (0.20 = CapEx의 20%)
  interval: number   // years (교체 주기)
}

export interface Tier2ExtraParams {
  wacc: number                         // fraction (0.08 = 8%)
  stackReplacement?: StackReplacement  // 전해조 전용
  electricityEscalation: number        // 전기료 연간 상승률 (%), 기본값 2
  gasEscalation: number                // 가스/석탄료 연간 상승률 (%), 기본값 2
  opexEscalation: number               // O&M 연간 상승률 (%), 기본값 2
  co2Price: number                     // $/tonne CO₂ (탄소 비용, 기본값 0)
}

export interface Tier2Result {
  lcoh: number               // $/kg H₂ (NPV-based)
  annualProduction: number   // kg H₂/year
  capexComponent: number     // $/kg H₂ (PV basis)
  opexComponent: number      // $/kg H₂ (PV basis)
  fuelComponent: number      // $/kg H₂ (PV basis)
  stackReplComponent: number // $/kg H₂ (PV basis, SMR=0)
  tier1Lcoh: number          // 비교용 Tier 1 LCOH
}

export interface SensitivityPoint {
  paramKey: string   // i18n 매핑 키
  lowLcoh: number    // -20% 시 LCOH
  highLcoh: number   // +20% 시 LCOH
  baseLcoh: number   // 기준 LCOH
  swing: number      // |highLcoh - lowLcoh| (정렬용)
}

// Tier 3 추가 파라미터
export interface Tier3ExtraParams {
  h2SellingPrice: number       // $/kg H₂ (수소 판매 가격)
  taxRate: number              // fraction (0.25 = 25%)
  depreciationYears: number    // 감가상각 기간 (년)
  constructionYears: number    // 건설 기간 (년)
  subsidyPerKgH2: number       // $/kg H₂ (보조금/세액공제, 기본값 0)
  subsidyDurationYears: number // 보조금 적용 연도 수 (기본 20 = lifetime 전체)
}

export type ScenarioId = 'optimistic' | 'base' | 'conservative'

export interface Tier3Scenario {
  id: ScenarioId
  capexMultiplier: number
  opexMultiplier: number
  fuelMultiplier: number
  priceMultiplier: number
}

export interface CashFlowRow {
  year: number
  revenue: number
  opex: number
  fuel: number
  stackRepl: number
  depreciation: number
  taxableIncome: number
  tax: number
  netCashFlow: number
  cumulativeCF: number
  pvCashFlow: number
  cumulativePV: number
}

export interface Tier3Result {
  cashFlows: CashFlowRow[]
  npv: number
  irr: number
  paybackYear: number | null   // null = 투자 회수 불가
  lcoh: number                 // Tier 2 기준 LCOH (참조용)
  scenarios: {
    id: ScenarioId
    npv: number
    irr: number
    paybackYear: number | null
  }[]
}

export interface BreakEvenResult {
  breakEvenPrice: number    // NPV=0이 되는 최소 H₂ 판매가 ($/kg)
  margin: number            // 현재 판매가 - break-even 가격 (양수면 수익, 음수면 손실)
}
