import type { ElectrolyzerParams, SmrParams } from './types'
import type { Translations } from '@/lib/i18n/ko'

export interface ValidationError {
  field: string
  message: string
}

export function validateElectrolyzerParams(p: ElectrolyzerParams, t?: Translations): ValidationError[] {
  const v = t?.validation
  const errors: ValidationError[] = []
  if (!p.systemCapacity || p.systemCapacity <= 0)
    errors.push({ field: 'systemCapacity', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.systemCapacity > 10_000_000)
    errors.push({ field: 'systemCapacity', message: v?.maxSystemCapacity ?? '10,000,000 kW 이하로 입력하세요' })
  if (!p.capex || p.capex <= 0) errors.push({ field: 'capex', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.capex > 50_000)
    errors.push({ field: 'capex', message: v?.maxCapex ?? '50,000 $/kW 이하로 입력하세요 (비현실적 값)' })
  if (p.opexRate < 0 || p.opexRate > 1)
    errors.push({ field: 'opexRate', message: v?.opexRange ?? '0~1 사이여야 합니다 (예: 0.04 = 4%)' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 1)
    errors.push({ field: 'capacityFactor', message: v?.cfRange ?? '0 초과 1 이하여야 합니다 (예: 0.9 = 90%)' })
  if (!p.energyConsumption || p.energyConsumption <= 0)
    errors.push({ field: 'energyConsumption', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.energyConsumption > 200)
    errors.push({ field: 'energyConsumption', message: v?.maxEnergyConsumption ?? '200 kWh/kg 이하로 입력하세요 (비현실적 값)' })
  if (!p.electricityCost || p.electricityCost <= 0)
    errors.push({ field: 'electricityCost', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.electricityCost > 1)
    errors.push({ field: 'electricityCost', message: v?.maxElecCost ?? '1.00 $/kWh 이하로 입력하세요' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.lifetime > 50)
    errors.push({ field: 'lifetime', message: v?.maxLifetime ?? '50년 이하로 입력하세요' })
  return errors
}

export function validateSmrParams(p: SmrParams, t?: Translations): ValidationError[] {
  const v = t?.validation
  const errors: ValidationError[] = []
  if (!p.plantCapacity || p.plantCapacity <= 0)
    errors.push({ field: 'plantCapacity', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.plantCapacity > 10_000)
    errors.push({ field: 'plantCapacity', message: v?.maxPlantCapacity ?? '10,000 tonne/day 이하로 입력하세요' })
  if (!p.capexPerTpd || p.capexPerTpd <= 0)
    errors.push({ field: 'capexPerTpd', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.capexPerTpd > 100_000_000)
    errors.push({ field: 'capexPerTpd', message: v?.maxSmrCapex ?? '비현실적으로 높은 CapEx입니다' })
  if (!p.capacityFactor || p.capacityFactor <= 0 || p.capacityFactor > 1)
    errors.push({ field: 'capacityFactor', message: v?.cfRange ?? '0 초과 1 이하여야 합니다 (예: 0.9 = 90%)' })
  if (!p.lifetime || p.lifetime <= 0) errors.push({ field: 'lifetime', message: v?.greaterThanZero ?? '0보다 커야 합니다' })
  if (p.lifetime > 50)
    errors.push({ field: 'lifetime', message: v?.maxLifetime ?? '50년 이하로 입력하세요' })
  return errors
}
