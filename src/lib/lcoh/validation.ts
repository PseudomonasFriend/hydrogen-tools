import type { ElectrolyzerParams, SmrParams } from './types'

export interface ValidationError {
  field: string
  message: string
}

export function validateElectrolyzerParams(p: ElectrolyzerParams): ValidationError[] {
  const errors: ValidationError[] = []
  if (!p.systemCapacity || p.systemCapacity <= 0)
    errors.push({ field: 'systemCapacity', message: '0보다 커야 합니다' })
  if (p.systemCapacity > 10_000_000)
    errors.push({ field: 'systemCapacity', message: '10,000,000 kW 이하로 입력하세요' })
  if (!p.capex || p.capex <= 0) errors.push({ field: 'capex', message: '0보다 커야 합니다' })
  if (p.capex > 50_000)
    errors.push({ field: 'capex', message: '50,000 $/kW 이하로 입력하세요 (비현실적 값)' })
  if (p.opexRate < 0 || p.opexRate > 1)
    errors.push({ field: 'opexRate', message: '0~1 사이여야 합니다 (예: 0.04 = 4%)' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 1)
    errors.push({ field: 'capacityFactor', message: '0 초과 1 이하여야 합니다 (예: 0.9 = 90%)' })
  if (!p.energyConsumption || p.energyConsumption <= 0)
    errors.push({ field: 'energyConsumption', message: '0보다 커야 합니다' })
  if (p.energyConsumption > 200)
    errors.push({ field: 'energyConsumption', message: '200 kWh/kg 이하로 입력하세요 (비현실적 값)' })
  if (!p.electricityCost || p.electricityCost <= 0)
    errors.push({ field: 'electricityCost', message: '0보다 커야 합니다' })
  if (p.electricityCost > 1)
    errors.push({ field: 'electricityCost', message: '1.00 $/kWh 이하로 입력하세요' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: '0보다 커야 합니다' })
  if (p.lifetime > 50)
    errors.push({ field: 'lifetime', message: '50년 이하로 입력하세요' })
  return errors
}

export function validateSmrParams(p: SmrParams): ValidationError[] {
  const errors: ValidationError[] = []
  if (!p.plantCapacity || p.plantCapacity <= 0)
    errors.push({ field: 'plantCapacity', message: '0보다 커야 합니다' })
  if (p.plantCapacity > 10_000)
    errors.push({ field: 'plantCapacity', message: '10,000 tonne/day 이하로 입력하세요' })
  if (!p.capexPerTpd || p.capexPerTpd <= 0)
    errors.push({ field: 'capexPerTpd', message: '0보다 커야 합니다' })
  if (p.capexPerTpd > 100_000_000)
    errors.push({ field: 'capexPerTpd', message: '비현실적으로 높은 CapEx입니다' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 1)
    errors.push({ field: 'capacityFactor', message: '0 초과 1 이하여야 합니다 (예: 0.9 = 90%)' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: '0보다 커야 합니다' })
  if (p.lifetime > 50)
    errors.push({ field: 'lifetime', message: '50년 이하로 입력하세요' })
  return errors
}
