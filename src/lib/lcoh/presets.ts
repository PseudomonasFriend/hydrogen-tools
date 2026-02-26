export interface RegionalPreset {
  id: string
  labelKo: string
  labelEn: string
  electricityCost: number  // $/kWh (전해조용)
  naturalGasCost: number   // $/kg H₂ 환산 (SMR용)
  coalCost: number         // $/kg H₂ 환산 (석탄 가스화용)
}

export const REGIONAL_PRESETS: RegionalPreset[] = [
  { id: 'korea',   labelKo: '한국',   labelEn: 'Korea',        electricityCost: 0.10, naturalGasCost: 1.4,  coalCost: 0.5 },
  { id: 'usa',     labelKo: '미국',   labelEn: 'USA',          electricityCost: 0.07, naturalGasCost: 0.8,  coalCost: 0.4 },
  { id: 'europe',  labelKo: '유럽',   labelEn: 'Europe (DE)',  electricityCost: 0.15, naturalGasCost: 1.5,  coalCost: 0.6 },
  { id: 'mideast', labelKo: '중동',   labelEn: 'Middle East',  electricityCost: 0.03, naturalGasCost: 0.5,  coalCost: 0.3 },
  { id: 'chile',     labelKo: '칠레',   labelEn: 'Chile',       electricityCost: 0.04, naturalGasCost: 1.9,  coalCost: 0.5  },
  { id: 'australia', labelKo: '호주',   labelEn: 'Australia',  electricityCost: 0.03, naturalGasCost: 0.9,  coalCost: 0.35 },
  { id: 'india',     labelKo: '인도',   labelEn: 'India',      electricityCost: 0.06, naturalGasCost: 1.1,  coalCost: 0.4  },
]
