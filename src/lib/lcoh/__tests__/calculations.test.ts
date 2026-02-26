import { describe, it, expect } from 'vitest'
import { calcElectrolyzerLCOH, calcSmrLCOH } from '../calculations'
import { DEFAULT_PARAMS } from '../pathways'
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
