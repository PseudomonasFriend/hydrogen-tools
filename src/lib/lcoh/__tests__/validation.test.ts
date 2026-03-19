import { describe, it, expect } from 'vitest'
import { validateElectrolyzerParams, validateSmrParams } from '../validation'
import type { ElectrolyzerParams, SmrParams } from '../types'

const validElec: ElectrolyzerParams = {
  systemCapacity: 1000,
  capex: 800,
  opexRate: 0.04,
  capacityFactor: 0.45,
  energyConsumption: 55,
  electricityCost: 0.05,
  heatConsumption: 0,
  heatCost: 0,
  lifetime: 20,
}

const validSmr: SmrParams = {
  plantCapacity: 100,
  capexPerTpd: 1_200_000,
  opexRate: 0.04,
  capacityFactor: 0.9,
  naturalGasCostPerKgH2: 1.2,
  lifetime: 25,
}

// ── 전해조 검증 ──────────────────────────────────────────────────────────
describe('validateElectrolyzerParams — 유효한 값', () => {
  it('에러 없음', () => {
    expect(validateElectrolyzerParams(validElec)).toHaveLength(0)
  })
})

describe('validateElectrolyzerParams — systemCapacity', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, systemCapacity: 0 })
    expect(errors.some(e => e.field === 'systemCapacity')).toBe(true)
  })

  it('음수이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, systemCapacity: -1 })
    expect(errors.some(e => e.field === 'systemCapacity')).toBe(true)
  })

  it('10,000,000 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, systemCapacity: 10_000_001 })
    expect(errors.some(e => e.field === 'systemCapacity')).toBe(true)
  })

  it('10,000,000 이하이면 정상', () => {
    expect(validateElectrolyzerParams({ ...validElec, systemCapacity: 10_000_000 })).toHaveLength(0)
  })
})

describe('validateElectrolyzerParams — capex', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, capex: 0 })
    expect(errors.some(e => e.field === 'capex')).toBe(true)
  })

  it('50,000 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, capex: 50_001 })
    expect(errors.some(e => e.field === 'capex')).toBe(true)
  })
})

describe('validateElectrolyzerParams — opexRate', () => {
  it('음수이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, opexRate: -0.01 })
    expect(errors.some(e => e.field === 'opexRate')).toBe(true)
  })

  it('1 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, opexRate: 1.01 })
    expect(errors.some(e => e.field === 'opexRate')).toBe(true)
  })

  it('0은 허용', () => {
    expect(validateElectrolyzerParams({ ...validElec, opexRate: 0 })).toHaveLength(0)
  })
})

describe('validateElectrolyzerParams — capacityFactor', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, capacityFactor: 0 })
    expect(errors.some(e => e.field === 'capacityFactor')).toBe(true)
  })

  it('1 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, capacityFactor: 1.01 })
    expect(errors.some(e => e.field === 'capacityFactor')).toBe(true)
  })

  it('1.0 허용', () => {
    expect(validateElectrolyzerParams({ ...validElec, capacityFactor: 1.0 })).toHaveLength(0)
  })
})

describe('validateElectrolyzerParams — energyConsumption', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, energyConsumption: 0 })
    expect(errors.some(e => e.field === 'energyConsumption')).toBe(true)
  })

  it('200 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, energyConsumption: 201 })
    expect(errors.some(e => e.field === 'energyConsumption')).toBe(true)
  })
})

describe('validateElectrolyzerParams — electricityCost', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, electricityCost: 0 })
    expect(errors.some(e => e.field === 'electricityCost')).toBe(true)
  })

  it('1.00 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, electricityCost: 1.01 })
    expect(errors.some(e => e.field === 'electricityCost')).toBe(true)
  })

  it('1.00은 허용', () => {
    expect(validateElectrolyzerParams({ ...validElec, electricityCost: 1.0 })).toHaveLength(0)
  })
})

describe('validateElectrolyzerParams — lifetime', () => {
  it('0이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, lifetime: 0 })
    expect(errors.some(e => e.field === 'lifetime')).toBe(true)
  })

  it('50 초과이면 에러', () => {
    const errors = validateElectrolyzerParams({ ...validElec, lifetime: 51 })
    expect(errors.some(e => e.field === 'lifetime')).toBe(true)
  })

  it('50은 허용', () => {
    expect(validateElectrolyzerParams({ ...validElec, lifetime: 50 })).toHaveLength(0)
  })
})

// ── SMR 검증 ─────────────────────────────────────────────────────────────
describe('validateSmrParams — 유효한 값', () => {
  it('에러 없음', () => {
    expect(validateSmrParams(validSmr)).toHaveLength(0)
  })
})

describe('validateSmrParams — plantCapacity', () => {
  it('0이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, plantCapacity: 0 })
    expect(errors.some(e => e.field === 'plantCapacity')).toBe(true)
  })

  it('10,000 초과이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, plantCapacity: 10_001 })
    expect(errors.some(e => e.field === 'plantCapacity')).toBe(true)
  })
})

describe('validateSmrParams — capexPerTpd', () => {
  it('0이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, capexPerTpd: 0 })
    expect(errors.some(e => e.field === 'capexPerTpd')).toBe(true)
  })

  it('100,000,000 초과이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, capexPerTpd: 100_000_001 })
    expect(errors.some(e => e.field === 'capexPerTpd')).toBe(true)
  })
})

describe('validateSmrParams — capacityFactor', () => {
  it('0이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, capacityFactor: 0 })
    expect(errors.some(e => e.field === 'capacityFactor')).toBe(true)
  })

  it('1 초과이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, capacityFactor: 1.01 })
    expect(errors.some(e => e.field === 'capacityFactor')).toBe(true)
  })
})

describe('validateSmrParams — lifetime', () => {
  it('0이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, lifetime: 0 })
    expect(errors.some(e => e.field === 'lifetime')).toBe(true)
  })

  it('50 초과이면 에러', () => {
    const errors = validateSmrParams({ ...validSmr, lifetime: 51 })
    expect(errors.some(e => e.field === 'lifetime')).toBe(true)
  })
})

describe('validateSmrParams — 복수 에러', () => {
  it('여러 필드 오류 시 모두 반환', () => {
    const errors = validateSmrParams({ ...validSmr, plantCapacity: 0, lifetime: 0 })
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})
