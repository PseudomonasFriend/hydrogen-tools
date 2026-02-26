import type { ElectrolyzerParams, SmrParams } from './types'

export interface ValidationError {
  field: string
  message: string
}

export function validateElectrolyzerParams(p: ElectrolyzerParams): ValidationError[] {
  const errors: ValidationError[] = []
  if (!p.systemCapacity || p.systemCapacity <= 0)
    errors.push({ field: 'systemCapacity', message: '0보다 커야 합니다' })
  if (!p.capex || p.capex <= 0) errors.push({ field: 'capex', message: '0보다 커야 합니다' })
  if (p.opexRate < 0 || p.opexRate > 100)
    errors.push({ field: 'opexRate', message: '0~100 사이여야 합니다' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 100)
    errors.push({ field: 'capacityFactor', message: '0 초과 100 이하여야 합니다' })
  if (!p.energyConsumption || p.energyConsumption <= 0)
    errors.push({ field: 'energyConsumption', message: '0보다 커야 합니다' })
  if (!p.electricityCost || p.electricityCost <= 0)
    errors.push({ field: 'electricityCost', message: '0보다 커야 합니다' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: '0보다 커야 합니다' })
  return errors
}

export function validateSmrParams(p: SmrParams): ValidationError[] {
  const errors: ValidationError[] = []
  if (!p.plantCapacity || p.plantCapacity <= 0)
    errors.push({ field: 'plantCapacity', message: '0보다 커야 합니다' })
  if (!p.capexPerTpd || p.capexPerTpd <= 0)
    errors.push({ field: 'capexPerTpd', message: '0보다 커야 합니다' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 100)
    errors.push({ field: 'capacityFactor', message: '0 초과 100 이하여야 합니다' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: '0보다 커야 합니다' })
  return errors
}
