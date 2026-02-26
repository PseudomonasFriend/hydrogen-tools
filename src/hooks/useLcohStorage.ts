'use client'
import { useCallback } from 'react'
import type { PathwayId, ElectrolyzerParams, SmrParams, Tier2ExtraParams, Tier3ExtraParams } from '@/lib/lcoh/types'

const KEY = {
  pathway: 'lcoh_pathway',
  params: (id: PathwayId) => `lcoh_params_${id}`,
  t2: (id: PathwayId) => `lcoh_t2_${id}`,
  t3: (id: PathwayId) => `lcoh_t3_${id}`,
} as const

export function useLcohStorage() {
  const savePathway = useCallback((id: PathwayId) => {
    try {
      localStorage.setItem(KEY.pathway, id)
    } catch {
      /* SSR 환경 무시 */
    }
  }, [])

  const loadPathway = useCallback((): PathwayId | null => {
    try {
      return localStorage.getItem(KEY.pathway) as PathwayId | null
    } catch {
      return null
    }
  }, [])

  const saveParams = useCallback((id: PathwayId, params: ElectrolyzerParams | SmrParams) => {
    try {
      localStorage.setItem(KEY.params(id), JSON.stringify(params))
    } catch {
      /* ignore */
    }
  }, [])

  const loadParams = useCallback(<T,>(id: PathwayId, fallback: T): T => {
    try {
      const raw = localStorage.getItem(KEY.params(id))
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }, [])

  const saveT2 = useCallback((id: PathwayId, t2: Tier2ExtraParams) => {
    try {
      localStorage.setItem(KEY.t2(id), JSON.stringify(t2))
    } catch {
      /* ignore */
    }
  }, [])

  const loadT2 = useCallback(
    (id: PathwayId, fallback: Tier2ExtraParams): Tier2ExtraParams => {
      try {
        const raw = localStorage.getItem(KEY.t2(id))
        return raw ? (JSON.parse(raw) as Tier2ExtraParams) : fallback
      } catch {
        return fallback
      }
    },
    []
  )

  const saveT3 = useCallback((id: PathwayId, t3: Tier3ExtraParams) => {
    try {
      localStorage.setItem(KEY.t3(id), JSON.stringify(t3))
    } catch {
      /* ignore */
    }
  }, [])

  const loadT3 = useCallback(
    (id: PathwayId, fallback: Tier3ExtraParams): Tier3ExtraParams => {
      try {
        const raw = localStorage.getItem(KEY.t3(id))
        return raw ? (JSON.parse(raw) as Tier3ExtraParams) : fallback
      } catch {
        return fallback
      }
    },
    []
  )

  return { savePathway, loadPathway, saveParams, loadParams, saveT2, loadT2, saveT3, loadT3 }
}
