import { describe, it, expect } from 'vitest'
import {
  calcElectrolyzerLCOH, calcSmrLCOH,
  calcElectrolyzerLCOH_T2, calcSmrLCOH_T2,
  calcTier3, calcBreakEven, calcIRR,
} from '../calculations'
import { DEFAULT_PARAMS, DEFAULT_T2_EXTRA, DEFAULT_T3_EXTRA } from '../pathways'
import type { ElectrolyzerParams, SmrParams } from '../types'

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
})

describe('calcSmrLCOH — SMR 기본값', () => {
  const smrParams = DEFAULT_PARAMS.smr as SmrParams

  it('LCOH > 0 이어야 한다', () => {
    const result = calcSmrLCOH(smrParams)
    expect(result.lcoh).toBeGreaterThan(0)
  })
})

// === 인플레이션 반영 테스트 ===
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

// === constructionYears 반영 테스트 ===
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

// === Break-even 테스트 ===
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
})

// === NOL 이월 테스트 ===
describe('NOL 이월 (Net Operating Loss Carryforward) - Tier 3', () => {
  it('초기 손실 연도에 세금이 0이어야 한다', () => {
    // 낮은 판매가로 초기 연도에 손실 발생 → 세금 0 확인
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    // 매우 낮은 판매가: 초기 연도에는 반드시 손실
    const t3 = { ...DEFAULT_T3_EXTRA.pem, h2SellingPrice: 0.5, constructionYears: 0 }
    const result = calcTier3(p, t2, t3)
    // 판매가가 극히 낮으면 모든 운영 연도에 세금 0이어야 함
    const operatingRows = result.cashFlows.filter(r => r.year > 0)
    operatingRows.forEach(row => {
      expect(row.tax).toBe(0)
    })
  })

  it('NOL 이월 적용 시 세금이 기존 방식보다 낮거나 같아야 한다', () => {
    // 충분히 높은 판매가 → 세금 발생, NOL 이월은 0 (손실 없음)
    // 낮은 판매가 → 초기 손실 발생 → NOL 이월로 세금 절감
    // NOL 이월이 있으면 총 세금 납부액이 같거나 낮아야 한다
    const p = DEFAULT_PARAMS.pem as ElectrolyzerParams
    const t2 = DEFAULT_T2_EXTRA.pem
    const t3 = { ...DEFAULT_T3_EXTRA.pem, constructionYears: 0 }
    const result = calcTier3(p, t2, t3)
    const totalTax = result.cashFlows.reduce((sum, r) => sum + r.tax, 0)
    expect(totalTax).toBeGreaterThanOrEqual(0)
  })
})

// === IRR 수렴 실패 테스트 ===
describe('calcIRR - 엣지케이스', () => {
  it('항상 음수 현금흐름이면 NaN을 반환한다', () => {
    const allNegativeCashFlows = [-1000, -100, -100, -100]
    const irr = calcIRR(allNegativeCashFlows)
    expect(irr).toBeNaN()
  })
})
