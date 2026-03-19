import type { PathwayId } from './types'

const SMR_PATHWAYS: PathwayId[] = ['smr', 'smr_ccs', 'atr_ccs', 'coal']

/** SMR/석탄 계열 경로인지 판별 */
export function isSmrPathway(id: PathwayId): boolean {
  return SMR_PATHWAYS.includes(id)
}
