import type { PathwayId, PathwayParams, Tier2ExtraParams, Tier3ExtraParams } from './types'

// IEA Global Hydrogen Review 2024 / IRENA 2024~2025 기반 기본값
export const DEFAULT_PARAMS: Record<PathwayId, PathwayParams> = {
  pem: {
    systemCapacity: 1000,
    capex: 1000,               // IEA 2024 중간값: $1,000/kW (범위: $700~1,400/kW)
    opexRate: 0.04,
    capacityFactor: 0.45,
    energyConsumption: 52,     // IEA 2024: 52~55 kWh/kg H₂
    electricityCost: 0.05,
    heatConsumption: 0,
    heatCost: 0,
    lifetime: 20,
  },
  alk: {
    systemCapacity: 1000,
    capex: 600,                // IEA 2024 중간값: $600/kW (범위: $400~800/kW, 성숙 기술)
    opexRate: 0.03,
    capacityFactor: 0.50,
    energyConsumption: 50,     // 효율 개선 반영
    electricityCost: 0.05,
    heatConsumption: 0,
    heatCost: 0,
    lifetime: 25,
  },
  aem: {
    systemCapacity: 1000,
    capex: 1200,               // 초기 상용화 단계
    opexRate: 0.04,
    capacityFactor: 0.45,
    energyConsumption: 53,     // 소폭 개선
    electricityCost: 0.05,
    heatConsumption: 0,
    heatCost: 0,
    lifetime: 15,
  },
  soec: {
    systemCapacity: 1000,
    capex: 3100,               // IEA 2024: (1700+700+400)×1.12 = 3,136 → 3,100
    opexRate: 0.05,
    capacityFactor: 0.70,      // 2024 실증 수준 현실적 값 (0.85는 과낙관적)
    energyConsumption: 35,     // 전기 소비량만 (kWh_e/kg H₂), 총 에너지 43에서 열 분리
    electricityCost: 0.04,
    heatConsumption: 8,        // 열 소비량 (kWh_th/kg H₂), 폐열 연계 시 0으로 설정 가능
    heatCost: 0.02,            // 열 단가 ($/kWh_th), 산업 폐열 기준 $0.01~0.03
    lifetime: 10,
  },
  smr: {
    plantCapacity: 100,
    capexPerTpd: 7_000_000,    // TIC 기준 현실 범위 $7~10M
    opexRate: 0.04,
    capacityFactor: 0.90,
    naturalGasCostPerKgH2: 1.2, // 2024 가스가격 하향
    lifetime: 25,
    co2EmissionFactor: 9,      // kg CO₂/kg H₂, IPCC 기준
  },
  smr_ccs: {
    plantCapacity: 100,
    capexPerTpd: 8_500_000,    // IEA 2024 중간값 (범위: $7.5~14M/tpd)
    opexRate: 0.045,
    capacityFactor: 0.90,
    naturalGasCostPerKgH2: 1.2,
    ccsCostPerKgH2: 0.6,      // 포집 비용 상승
    lifetime: 25,
    co2EmissionFactor: 1.5,    // kg CO₂/kg H₂, 포집 후 잔류
  },
  atr_ccs: {
    plantCapacity: 100,
    capexPerTpd: 11_000_000,   // ATR+CCS 설비비 (ASU로 인해 SMR+CCS보다 높음)
    opexRate: 0.04,
    capacityFactor: 0.90,
    naturalGasCostPerKgH2: 1.2,
    ccsCostPerKgH2: 0.5,      // 포집 비용 상승
    lifetime: 25,
    co2EmissionFactor: 1.0,    // kg CO₂/kg H₂, ATR 포집 효율이 더 높음
  },
  coal: {
    plantCapacity: 200,
    capexPerTpd: 7_000_000,    // 가스화 설비 상승
    opexRate: 0.05,
    capacityFactor: 0.85,
    naturalGasCostPerKgH2: 0,
    coalCostPerKgH2: 0.6,     // 2024 석탄 가격 반영
    lifetime: 30,
    co2EmissionFactor: 25,     // kg CO₂/kg H₂, 석탄 가스화 기준
  },
}

export type PathwayColor = 'green' | 'blue' | 'gray' | 'yellow'

export const PATHWAY_COLORS: Record<PathwayId, PathwayColor> = {
  pem: 'green',
  alk: 'green',
  aem: 'green',
  soec: 'green',
  smr: 'gray',
  smr_ccs: 'blue',
  atr_ccs: 'blue',
  coal: 'yellow',
}

export const PATHWAY_ORDER: PathwayId[] = ['pem', 'alk', 'aem', 'soec', 'smr', 'smr_ccs', 'atr_ccs', 'coal']

export const DEFAULT_T2_EXTRA: Record<PathwayId, Tier2ExtraParams> = {
  pem:     { wacc: 0.08, stackReplacement: { costRate: 0.40, interval: 8 }, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  alk:     { wacc: 0.08, stackReplacement: { costRate: 0.15, interval: 12 }, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  aem:     { wacc: 0.08, stackReplacement: { costRate: 0.25, interval: 5 }, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  soec:    { wacc: 0.08, stackReplacement: { costRate: 0.30, interval: 7 }, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  smr:     { wacc: 0.08, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  smr_ccs: { wacc: 0.08, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  atr_ccs: { wacc: 0.08, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
  coal:    { wacc: 0.08, electricityEscalation: 2, gasEscalation: 2, opexEscalation: 2, co2Price: 0 },
}

// Tier 3 추가 파라미터 기본값
export const DEFAULT_T3_EXTRA: Record<PathwayId, Tier3ExtraParams> = {
  pem:     { h2SellingPrice: 5.0, taxRate: 0.25, depreciationYears: 10, constructionYears: 2, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  alk:     { h2SellingPrice: 4.5, taxRate: 0.25, depreciationYears: 12, constructionYears: 2, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  aem:     { h2SellingPrice: 5.0, taxRate: 0.25, depreciationYears: 8,  constructionYears: 2, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  soec:    { h2SellingPrice: 5.5, taxRate: 0.25, depreciationYears: 7,  constructionYears: 2, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  smr:     { h2SellingPrice: 3.0, taxRate: 0.25, depreciationYears: 15, constructionYears: 3, subsidyPerKgH2: 0, subsidyDurationYears: 0 },
  smr_ccs: { h2SellingPrice: 3.5, taxRate: 0.25, depreciationYears: 15, constructionYears: 3, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  atr_ccs: { h2SellingPrice: 3.5, taxRate: 0.25, depreciationYears: 15, constructionYears: 3, subsidyPerKgH2: 0, subsidyDurationYears: 10 },
  coal:    { h2SellingPrice: 3.0, taxRate: 0.25, depreciationYears: 15, constructionYears: 3, subsidyPerKgH2: 0, subsidyDurationYears: 0 },
}
