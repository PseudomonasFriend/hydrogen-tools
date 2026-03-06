import type { ElectrolyzerParams, SmrParams, Tier1Result } from './types'

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
