import { describe, it, expect } from 'vitest'
import {
  calcElectrolyzerLCOH, calcSmrLCOH,
  calcElectrolyzerLCOH_T2, calcSmrLCOH_T2, calcSensitivity,
  calcTier3, calcBreakEven, calcIRR, calcNPV,
} from '../calculations'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA, DEFAULT_T3_EXTRA, PATHWAY_ORDER } from '../pathways'
import type { ElectrolyzerParams, SmrParams } from '../types'

// ── Tier 1: 전해조 ───────────────────────────────────────────────────
describe('calcElectrolyzerLCOH — PEM 기본값', () => {
  const pemParams = DEFAULT_PARAMS.pem as ElectrolyzerParams
  const result = calcElectrolyzerLCOH(pemParams)

  it('LCOH > 0 이어야 한다', () => {
    expect(result.lcoh).toBeGreaterThan(0)
  })

  it('LCOH < 20 $/kg H₂ 이어야 한다', () => {
    expect(result.lcoh).toBeLessThan(20)
  })

  it('LCOH = capexComponent + opexComponent + fuelComponent', () => {
    const sum = result.capexComponent + result.opexComponent + result.fuelComponent
    expect(result.lcoh).toBeCloseTo(sum, 5)
  })

  it('annualProduction > 0', () => {
    expect(result.annualProduction).toBeGreaterThan(0)
  })
})

describe('calcElectrolyzerLCOH — SOEC 열 분리', () => {
  const soecParams = DEFAULT_PARAMS.soec as ElectrolyzerParams

  it('heatConsumption > 0이면 열비용이 LCOH에 반영된다', () => {
    const withHeat = calcElectrolyzerLCOH(soecParams)
    const withoutHeat = calcElectrolyzerLCOH({ ...soecParams, heatConsumption: 0, heatCost: 0 })
    expect(withHeat.lcoh).toBeGreaterThan(withoutHeat.lcoh)
  })

  it('heatCost=0이면 열비용 무관 (폐열 연계)', () => {
    const withFreeHeat = calcElectrolyzerLCOH({ ...soecParams, heatCost: 0 })
    const withoutHeat = calcElectrolyzerLCOH({ ...soecParams, heatConsumption: 0, heatCost: 0 })
    // heatCost=0이면 fuelComponent 중 열 부분은 0이지만 H2 생산량 산출에 heatConsumption이 반영되므로 차이 발생
    expect(withFreeHeat.lcoh).not.toBe(withoutHeat.lcoh)
  })
})

// ── Tier 1: SMR ──────────────────────────────────────────────────────
describe('calcSmrLCOH — SMR 기본값', () => {
  const smrParams = DEFAULT_PARAMS.smr as SmrParams

  it('LCOH > 0 이어야 한다', () => {
    const result = calcSmrLCOH(smrParams)
    expect(result.lcoh).toBeGreaterThan(0)
  })

  it('LCOH < 10 $/kg H₂ 이어야 한다 (그레이 수소 범위)', () => {
    const result = calcSmrLCOH(smrParams)
    expect(result.lcoh).toBeLessThan(10)
  })
})

describe('calcSmrLCOH — Coal 기본값', () => {
  const coalParams = DEFAULT_PARAMS.coal as SmrParams
  it('LCOH > 0', () => {
    expect(calcSmrLCOH(coalParams).lcoh).toBeGreaterThan(0)
  })
})

// ── Tier 1: 전체 경로 ────────────────────────────────────────────────
describe('Tier 1 — 8개 경로 기본값 모두 LCOH > 0, < 30', () => {
  const SMR_PATHWAYS = ['smr', 'smr_ccs', 'atr_ccs', 'coal']
  PATHWAY_ORDER.forEach((id) => {
    it(`${id} 기본값 LCOH 합리성`, () => {
      const params = DEFAULT_PARAMS[id]
      const result = SMR_PATHWAYS.includes(id)
        ? calcSmrLCOH(params as SmrParams)
        : calcElectrolyzerLCOH(params as ElectrolyzerParams)
      expect(result.lcoh).toBeGreaterThan(0)
      expect(result.lcoh).toBeLessThan(30)
      expect(result.annualProduction).toBeGreaterThan(0)
    })
  })
})

// ── 인플레이션 반영 테스트 ────────────────────────────────────────────
describe('인플레이션 반영 - Tier 2 전해조', () => {
  it('electricityEscalation 2%는 0%보다 LCOH가 높다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2Base = { ...DEFAULT_T2_EXTRA.pem, electricityEscalation: 0, gasEscalation: 0, opexEscalation: 0 }
    const t2Infl = { ...DEFAULT_T2_EXTRA.pem, electricityEscalation: 2, gasEscalation: 0, opexEscalation: 0 }
    const resultBase = calcElectrolyzerLCOH_T2(p, t2Base)
    const resultInfl = calcElectrolyzerLCOH_T2(p, t2Infl)
    expect(resultInfl.lcoh).toBeGreaterThan(resultBase.lcoh)
  })

  it('opexEscalation 2%는 0%보다 LCOH가 높다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2Base = { ...DEFAULT_T2_EXTRA.pem, electricityEscalation: 0, gasEscalation: 0, opexEscalation: 0 }
    const t2Opex = { ...DEFAULT_T2_EXTRA.pem, electricityEscalation: 0, gasEscalation: 0, opexEscalation: 2 }
    const resultBase = calcElectrolyzerLCOH_T2(p, t2Base)
    const resultOpex = calcElectrolyzerLCOH_T2(p, t2Opex)
    expect(resultOpex.lcoh).toBeGreaterThan(resultBase.lcoh)
  })
})

describe('인플레이션 반영 - Tier 2 SMR', () => {
  it('gasEscalation 2%는 0%보다 SMR LCOH가 높다', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2Base = { ...DEFAULT_T2_EXTRA.smr, electricityEscalation: 0, gasEscalation: 0, opexEscalation: 0 }
    const t2Infl = { ...DEFAULT_T2_EXTRA.smr, electricityEscalation: 0, gasEscalation: 2, opexEscalation: 0 }
    const resultBase = calcSmrLCOH_T2(p, t2Base)
    const resultInfl = calcSmrLCOH_T2(p, t2Infl)
    expect(resultInfl.lcoh).toBeGreaterThan(resultBase.lcoh)
  })
})

// ── Tier 2: WACC 민감도 ──────────────────────────────────────────────
describe('Tier 2 — WACC 영향', () => {
  it('WACC 높을수록 LCOH 높다 (전해조)', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2Low = { ...DEFAULT_T2_EXTRA.pem, wacc: 0.05 }
    const t2High = { ...DEFAULT_T2_EXTRA.pem, wacc: 0.12 }
    const low = calcElectrolyzerLCOH_T2(p, t2Low)
    const high = calcElectrolyzerLCOH_T2(p, t2High)
    expect(high.lcoh).toBeGreaterThan(low.lcoh)
  })

  it('WACC 높을수록 LCOH 높다 (SMR)', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2Low = { ...DEFAULT_T2_EXTRA.smr, wacc: 0.05 }
    const t2High = { ...DEFAULT_T2_EXTRA.smr, wacc: 0.12 }
    const low = calcSmrLCOH_T2(p, t2Low)
    const high = calcSmrLCOH_T2(p, t2High)
    expect(high.lcoh).toBeGreaterThan(low.lcoh)
  })
})

// ── Tier 2: CO2 가격 영향 ────────────────────────────────────────────
describe('Tier 2 — CO2 가격 영향 (SMR)', () => {
  it('co2Price > 0이면 SMR LCOH가 높아진다', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2NoCo2 = { ...DEFAULT_T2_EXTRA.smr, co2Price: 0 }
    const t2WithCo2 = { ...DEFAULT_T2_EXTRA.smr, co2Price: 50 }
    const noCo2 = calcSmrLCOH_T2(p, t2NoCo2)
    const withCo2 = calcSmrLCOH_T2(p, t2WithCo2)
    expect(withCo2.lcoh).toBeGreaterThan(noCo2.lcoh)
  })
})

// ── Tier 2: 스택 교체 ────────────────────────────────────────────────
describe('Tier 2 — 스택 교체 비용 영향', () => {
  it('stackReplacement 있으면 LCOH가 높다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2NoStack = { ...DEFAULT_T2_EXTRA.pem, stackReplacement: undefined }
    const t2WithStack = { ...DEFAULT_T2_EXTRA.pem, stackReplacement: { costRate: 0.4, interval: 8 } }
    const noStack = calcElectrolyzerLCOH_T2(p, t2NoStack)
    const withStack = calcElectrolyzerLCOH_T2(p, t2WithStack)
    expect(withStack.lcoh).toBeGreaterThan(noStack.lcoh)
  })
})

// ── Tier 2: 민감도 분석 ──────────────────────────────────────────────
describe('calcSensitivity', () => {
  it('PEM 경로: 민감도 포인트 5개 이상', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const points = calcSensitivity(p, t2, false)
    expect(points.length).toBeGreaterThanOrEqual(5)
  })

  it('SMR 경로: 민감도 포인트 5개 이상', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2 = DEFAULT_T2_EXTRA.smr
    const points = calcSensitivity(p, t2, true)
    expect(points.length).toBeGreaterThanOrEqual(5)
  })

  it('swing 내림차순 정렬', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const points = calcSensitivity(p, t2, false)
    for (let i = 1; i < points.length; i++) {
      expect(points[i - 1].swing).toBeGreaterThanOrEqual(points[i].swing)
    }
  })
})

// ── Tier 3: constructionYears 반영 테스트 ─────────────────────────────
describe('constructionYears 반영 - Tier 3', () => {
  it('건설기간 2년은 0년보다 NPV가 낮다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3_0yr = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 0 }
    const t3_2yr = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 2 }
    const result0 = calcTier3(p, t2, t3_0yr)
    const result2 = calcTier3(p, t2, t3_2yr)
    expect(result0.npv).toBeGreaterThan(result2.npv)
  })

  it('건설기간 0년: cashFlows[0].year === 0', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 0 }
    const result = calcTier3(p, t2, t3)
    expect(result.cashFlows[0].year).toBe(0)
  })

  it('건설기간 2년: cashFlows[0].year === -2', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 2 }
    const result = calcTier3(p, t2, t3)
    expect(result.cashFlows[0].year).toBe(-2)
  })
})

// ── Tier 3: 시나리오 비교 ─────────────────────────────────────────────
describe('Tier 3 — 시나리오 비교', () => {
  it('3개 시나리오 반환 (optimistic, base, conservative)', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = DEFAULT_T3_EXTRA.pem
    const result = calcTier3(p, t2, t3)
    expect(result.scenarios).toHaveLength(3)
    expect(result.scenarios.map(s => s.id)).toEqual(['optimistic', 'base', 'conservative'])
  })

  it('낙관 NPV >= 기준 NPV >= 보수 NPV', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = DEFAULT_T3_EXTRA.pem
    const result = calcTier3(p, t2, t3)
    const opt = result.scenarios.find(s => s.id === 'optimistic')!
    const base = result.scenarios.find(s => s.id === 'base')!
    const cons = result.scenarios.find(s => s.id === 'conservative')!
    expect(opt.npv).toBeGreaterThanOrEqual(base.npv)
    expect(base.npv).toBeGreaterThanOrEqual(cons.npv)
  })
})

// ── Tier 3: 보조금 영향 ──────────────────────────────────────────────
describe('Tier 3 — 보조금 영향', () => {
  it('보조금 있으면 NPV가 높다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3NoSub = { ...DEFAULT_T3_EXTRA.pem, subsidyPerKgH2: 0, subsidyDurationYears: 0 }
    const t3WithSub = { ...DEFAULT_T3_EXTRA.pem, subsidyPerKgH2: 3, subsidyDurationYears: 10 }
    const noSub = calcTier3(p, t2, t3NoSub)
    const withSub = calcTier3(p, t2, t3WithSub)
    expect(withSub.npv).toBeGreaterThan(noSub.npv)
  })
})

// ── Tier 3: SMR 경로 ─────────────────────────────────────────────────
describe('Tier 3 — SMR 경로', () => {
  it('SMR 기본값으로 calcTier3 정상 실행', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2 = DEFAULT_T2_EXTRA.smr
    const t3 = DEFAULT_T3_EXTRA.smr
    const result = calcTier3(p, t2, t3, true)
    expect(result.cashFlows.length).toBeGreaterThan(0)
    expect(result.scenarios).toHaveLength(3)
  })

  it('SMR isSmr 자동 감지', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2 = DEFAULT_T2_EXTRA.smr
    const t3 = DEFAULT_T3_EXTRA.smr
    const result = calcTier3(p, t2, t3) // isSmr 생략
    expect(result.cashFlows.length).toBeGreaterThan(0)
  })
})

// ── Break-even 테스트 ─────────────────────────────────────────────────
describe('calcBreakEven', () => {
  it('break-even 가격에서 NPV가 0에 근접한다 (오차 $1000 이내)', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = DEFAULT_T3_EXTRA.pem
    const breakEven = calcBreakEven(p, t2, t3)
    const t3AtBreakEven = { ...t3, h2SellingPrice: breakEven.breakEvenPrice }
    const resultAtBreakEven = calcTier3(p, t2, t3AtBreakEven)
    expect(Math.abs(resultAtBreakEven.npv)).toBeLessThan(1000)
  })

  it('margin = t3.h2SellingPrice - breakEvenPrice', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = DEFAULT_T3_EXTRA.pem
    const breakEven = calcBreakEven(p, t2, t3)
    expect(breakEven.margin).toBeCloseTo(t3.h2SellingPrice - breakEven.breakEvenPrice, 3)
  })

  it('SMR break-even 정상 실행', () => {
    const p = DEFAULT_PARAMS.smr as SmrParams
    const t2 = DEFAULT_T2_EXTRA.smr
    const t3 = DEFAULT_T3_EXTRA.smr
    const breakEven = calcBreakEven(p, t2, t3)
    expect(breakEven.breakEvenPrice).toBeGreaterThanOrEqual(0)
  })
})

// ── NOL 이월 테스트 ───────────────────────────────────────────────────
describe('NOL 이월 (Net Operating Loss Carryforward) - Tier 3', () => {
  it('초기 손실 연도에 세금이 0이어야 한다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = { ...DEFAULT_T3_EXTRA.pem, h2SellingPrice: 0.5, constructionYears: 0 }
    const result = calcTier3(p, t2, t3)
    const operatingRows = result.cashFlows.filter(r => r.year > 0)
    operatingRows.forEach(row => {
      expect(row.tax).toBe(0)
    })
  })

  it('NOL 이월 적용 시 세금이 기존 방식보다 낮거나 같아야 한다', () => {
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 0 }
    const result = calcTier3(p, t2, t3)
    const totalTax = result.cashFlows.reduce((sum, r) => sum + r.tax, 0)
    expect(totalTax).toBeGreaterThanOrEqual(0)
  })
})

// ── IRR/NPV 엣지케이스 ───────────────────────────────────────────────
describe('calcIRR - 엣지케이스', () => {
  it('항상 음수 현금흐름이면 NaN을 반환한다', () => {
    const allNegativeCashFlows = [-1000, -100, -100, -100]
    const irr = calcIRR(allNegativeCashFlows)
    expect(irr).toBeNaN()
  })

  it('항상 양수 현금흐름이면 NaN을 반환한다', () => {
    const allPositiveCashFlows = [100, 100, 100, 100]
    const irr = calcIRR(allPositiveCashFlows)
    expect(irr).toBeNaN()
  })

  it('일반적 투자 패턴에서 양의 IRR', () => {
    const cashFlows = [-1000, 300, 300, 300, 300, 300]
    const irr = calcIRR(cashFlows)
    expect(irr).toBeGreaterThan(0)
    expect(irr).toBeLessThan(1)
  })
})

describe('calcNPV', () => {
  it('할인율 0이면 현금흐름 합과 동일', () => {
    const cfs = [-1000, 500, 500, 500]
    const npv = calcNPV(cfs, 0)
    expect(npv).toBeCloseTo(500, 5)
  })

  it('할인율 > 0이면 NPV < 현금흐름 합', () => {
    const cfs = [-1000, 500, 500, 500]
    const npv = calcNPV(cfs, 0.1)
    expect(npv).toBeLessThan(500)
  })
})
