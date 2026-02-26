// 전해조 경로 레퍼런스 값 세트 (2024 기준 USD)
export interface ElectrolyzerCapexRef {
  id: string
  labelKo: string
  labelEn: string
  source: string        // 예: 'IEA Global Hydrogen Review 2024'
  year: number
  // Level 0
  totalCapex: number    // $/kW (all-in, mid-range)
  totalCapexLow?: number
  totalCapexHigh?: number
  // Level 1 (선택적)
  electrolyzerSystem?: number  // $/kW
  bop?: number                 // $/kW
  epc?: number                 // $/kW
  contingency?: number         // %
  // Level 2 (선택적)
  stack?: number               // $/kW
  bos?: number                 // $/kW
}

export interface SmrCapexRef {
  id: string
  labelKo: string
  labelEn: string
  source: string
  year: number
  // Level 0 ($/tpd)
  totalCapex: number
  totalCapexLow?: number
  totalCapexHigh?: number
  // Level 1 (선택적, $/tpd)
  reformer?: number
  gasCleanup?: number
  ccs?: number          // CCS 경로만
  utilities?: number
  epc?: number
}

// PEM 레퍼런스 세트
export const PEM_CAPEX_REFS: ElectrolyzerCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 1000,
    totalCapexLow: 700,
    totalCapexHigh: 1400,
    electrolyzerSystem: 550,
    bop: 280,
    epc: 170,
    contingency: 10,
    stack: 320,
    bos: 230,
  },
  {
    id: 'irena_2024',
    labelKo: 'IRENA 2024',
    labelEn: 'IRENA 2024',
    source: 'IRENA Electrolyser Manufacturing Outlook 2024',
    year: 2024,
    totalCapex: 800,
    totalCapexLow: 500,
    totalCapexHigh: 1100,
    electrolyzerSystem: 430,
    bop: 240,
    epc: 130,
    contingency: 10,
  },
  {
    id: 'doe_2023',
    labelKo: 'DOE 2023',
    labelEn: 'DOE 2023',
    source: 'DOE Hydrogen Program Record 2023',
    year: 2023,
    totalCapex: 1200,
    totalCapexLow: 800,
    totalCapexHigh: 1600,
    electrolyzerSystem: 680,
    bop: 320,
    epc: 200,
    contingency: 15,
    stack: 400,
    bos: 280,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 1000,
  },
]

// ALK 레퍼런스 세트
export const ALK_CAPEX_REFS: ElectrolyzerCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 600,
    totalCapexLow: 400,
    totalCapexHigh: 800,
    electrolyzerSystem: 310,
    bop: 190,
    epc: 100,
    contingency: 10,
  },
  {
    id: 'irena_2024',
    labelKo: 'IRENA 2024',
    labelEn: 'IRENA 2024',
    source: 'IRENA Electrolyser Manufacturing Outlook 2024',
    year: 2024,
    totalCapex: 500,
    totalCapexLow: 350,
    totalCapexHigh: 750,
    electrolyzerSystem: 260,
    bop: 160,
    epc: 80,
    contingency: 10,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 800,
  },
]

// AEM 레퍼런스 세트
export const AEM_CAPEX_REFS: ElectrolyzerCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 1200,
    totalCapexLow: 800,
    totalCapexHigh: 1600,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 1200,
  },
]

// SOEC 레퍼런스 세트
export const SOEC_CAPEX_REFS: ElectrolyzerCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 2800,
    totalCapexLow: 1800,
    totalCapexHigh: 3800,
    electrolyzerSystem: 1700,
    bop: 700,
    epc: 400,
    contingency: 12,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 2800,
  },
]

// SMR (Grey) 레퍼런스
export const SMR_CAPEX_REFS: SmrCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 7_000_000,
    totalCapexLow: 5_000_000,
    totalCapexHigh: 10_000_000,
    reformer: 2_800_000,
    gasCleanup: 1_200_000,
    utilities: 1_400_000,
    epc: 1_600_000,
  },
  {
    id: 'doe_2023',
    labelKo: 'DOE 2023',
    labelEn: 'DOE H2A 2023',
    source: 'DOE H2A Central Production Model v4.0',
    year: 2023,
    totalCapex: 8_000_000,
    totalCapexLow: 6_000_000,
    totalCapexHigh: 11_000_000,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 7_000_000,
  },
]

// SMR+CCS (Blue) 레퍼런스
export const SMR_CCS_CAPEX_REFS: SmrCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 10_000_000,
    totalCapexLow: 7_500_000,
    totalCapexHigh: 14_000_000,
    reformer: 3_200_000,
    gasCleanup: 1_400_000,
    ccs: 2_800_000,
    utilities: 1_200_000,
    epc: 1_400_000,
  },
  {
    id: 'doe_2023',
    labelKo: 'DOE 2023',
    labelEn: 'DOE H2A 2023',
    source: 'DOE H2A Central Production Model v4.0',
    year: 2023,
    totalCapex: 11_000_000,
    totalCapexLow: 8_500_000,
    totalCapexHigh: 15_000_000,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 10_000_000,
  },
]

// ATR+CCS (Blue) 레퍼런스
export const ATR_CCS_CAPEX_REFS: SmrCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 11_000_000,
    totalCapexLow: 8_000_000,
    totalCapexHigh: 15_000_000,
    reformer: 4_000_000,   // ASU 포함
    gasCleanup: 1_200_000,
    ccs: 2_500_000,
    utilities: 1_300_000,
    epc: 2_000_000,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 11_000_000,
  },
]

// Coal (Brown) 레퍼런스
export const COAL_CAPEX_REFS: SmrCapexRef[] = [
  {
    id: 'iea_2024',
    labelKo: 'IEA 2024',
    labelEn: 'IEA 2024',
    source: 'IEA Global Hydrogen Review 2024',
    year: 2024,
    totalCapex: 7_000_000,
    totalCapexLow: 5_000_000,
    totalCapexHigh: 9_000_000,
  },
  {
    id: 'custom',
    labelKo: '직접 입력',
    labelEn: 'Custom',
    source: '',
    year: 2024,
    totalCapex: 7_000_000,
  },
]

import type { PathwayId } from './types'

export function getCapexRefs(pathway: PathwayId): ElectrolyzerCapexRef[] | SmrCapexRef[] {
  switch (pathway) {
    case 'pem': return PEM_CAPEX_REFS
    case 'alk': return ALK_CAPEX_REFS
    case 'aem': return AEM_CAPEX_REFS
    case 'soec': return SOEC_CAPEX_REFS
    case 'smr': return SMR_CAPEX_REFS
    case 'smr_ccs': return SMR_CCS_CAPEX_REFS
    case 'atr_ccs': return ATR_CCS_CAPEX_REFS
    case 'coal': return COAL_CAPEX_REFS
  }
}
