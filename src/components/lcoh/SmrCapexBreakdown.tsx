'use client'

import { useState } from 'react'
import type { PathwayId, Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { SMR_CAPEX_REFS, SMR_CCS_CAPEX_REFS, ATR_CCS_CAPEX_REFS, COAL_CAPEX_REFS } from '@/lib/lcoh/capex-references'
import type { SmrCapexRef } from '@/lib/lcoh/capex-references'

interface SmrBreakdown {
  reformer: number      // $/tpd
  gasCleanup: number    // $/tpd
  ccs: number           // $/tpd (CCS 경로만 사용)
  utilities: number     // $/tpd
  epc: number           // $/tpd
}

interface Props {
  pathway: PathwayId
  capexPerTpd: number
  onCapexChange: (v: number) => void
  lang: Lang
  t: Translations
}

function getRefsByPathway(pathway: PathwayId): SmrCapexRef[] {
  switch (pathway) {
    case 'smr_ccs': return SMR_CCS_CAPEX_REFS
    case 'atr_ccs': return ATR_CCS_CAPEX_REFS
    case 'coal': return COAL_CAPEX_REFS
    default: return SMR_CAPEX_REFS
  }
}

function isCcsPathway(pathway: PathwayId): boolean {
  return pathway === 'smr_ccs' || pathway === 'atr_ccs'
}

function hasLevel1Data(ref: SmrCapexRef): boolean {
  return (
    ref.reformer !== undefined &&
    ref.gasCleanup !== undefined &&
    ref.utilities !== undefined &&
    ref.epc !== undefined
  )
}

export default function SmrCapexBreakdown({ pathway, capexPerTpd, onCapexChange, lang, t }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [selectedRefId, setSelectedRefId] = useState('custom')
  const refs = getRefsByPathway(pathway)
  const isCcs = isCcsPathway(pathway)
  const isCoal = pathway === 'coal'

  // Level 1 초기값 설정
  const defaultL1 = (): SmrBreakdown => {
    const ref = refs[0]
    if (hasLevel1Data(ref)) {
      return {
        reformer: ref.reformer!,
        gasCleanup: ref.gasCleanup!,
        ccs: ref.ccs ?? 0,
        utilities: ref.utilities!,
        epc: ref.epc!,
      }
    }
    // fallback: capexPerTpd 비율로 추정 (CCS 없는 경로)
    return {
      reformer: Math.round(capexPerTpd * 0.40),
      gasCleanup: Math.round(capexPerTpd * 0.17),
      ccs: 0,
      utilities: Math.round(capexPerTpd * 0.20),
      epc: Math.round(capexPerTpd * 0.23),
    }
  }

  const [breakdown, setBreakdown] = useState<SmrBreakdown>(defaultL1)

  // Level 1 합산: reformer + gasCleanup + (ccs if CCS pathway) + utilities + epc
  const derivedTotal =
    breakdown.reformer +
    breakdown.gasCleanup +
    (isCcs ? breakdown.ccs : 0) +
    breakdown.utilities +
    breakdown.epc

  const discrepancy =
    capexPerTpd > 0 ? Math.abs(derivedTotal - capexPerTpd) / capexPerTpd * 100 : 0

  // 레퍼런스 선택 시 값 자동 입력
  const handleRefChange = (refId: string) => {
    setSelectedRefId(refId)
    const ref = refs.find(r => r.id === refId)
    if (!ref) return
    if (refId === 'custom') {
      return
    }
    // Level 0 반영
    onCapexChange(ref.totalCapex)
    // Level 1 반영 (있는 경우)
    if (hasLevel1Data(ref)) {
      setBreakdown({
        reformer: ref.reformer!,
        gasCleanup: ref.gasCleanup!,
        ccs: ref.ccs ?? 0,
        utilities: ref.utilities!,
        epc: ref.epc!,
      })
    }
  }

  // Level 1 변경 시 합산 → Level 0 자동 업데이트
  const handleL1Change = (key: keyof SmrBreakdown, value: number) => {
    const next = { ...breakdown, [key]: value }
    setBreakdown(next)
    const sum =
      next.reformer +
      next.gasCleanup +
      (isCcs ? next.ccs : 0) +
      next.utilities +
      next.epc
    onCapexChange(sum)
  }

  const selectedRefObj = refs.find(r => r.id === selectedRefId)

  // coal은 Level 1 데이터가 없으므로 "항목별로 나눠서 입력" 버튼 비활성화
  const canExpand = !isCoal

  // 단위를 읽기 쉽게 포맷 (예: 7,000,000 → 7.0M)
  const fmtTpd = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
    return `$${v}`
  }

  return (
    <div className="space-y-2">
      {/* Level 0: 레퍼런스 드롭다운 + 범위 힌트 */}
      <div className="flex items-center gap-2">
        <select
          value={selectedRefId}
          onChange={(e) => handleRefChange(e.target.value)}
          className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          {refs.map(r => (
            <option key={r.id} value={r.id}>
              {lang === 'ko' ? r.labelKo : r.labelEn}
            </option>
          ))}
        </select>
        {selectedRefObj && selectedRefObj.totalCapexLow && selectedRefObj.totalCapexHigh && (
          <span className="text-xs text-gray-400">
            {fmtTpd(selectedRefObj.totalCapexLow)}~{fmtTpd(selectedRefObj.totalCapexHigh)} $/tpd
          </span>
        )}
      </div>

      {/* source 출처 표시 */}
      {selectedRefObj && selectedRefObj.source && (
        <p className="text-xs text-gray-400 italic">{selectedRefObj.source}</p>
      )}

      {/* SMR CapEx 기준 규모 안내 툴팁 */}
      <p className="text-xs text-gray-400 flex items-center gap-1" title={t.lcoh3.smrScaleTooltip}>
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        <span>{t.lcoh3.smrScaleTooltip}</span>
      </p>

      {/* Level 0 입력 */}
      <input
        type="number"
        value={capexPerTpd}
        step={100000}
        min={0}
        onChange={(e) => {
          onCapexChange(parseFloat(e.target.value) || 0)
          setSelectedRefId('custom')
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Level 1 펼치기 버튼 (coal은 숨김) */}
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>{expanded ? '▲' : '▼'}</span>
          <span>{t.common.breakdownExpand}</span>
        </button>
      )}

      {expanded && canExpand && (
        <div className="ml-2 space-y-2 border-l-2 border-blue-100 pl-3">
          {/* 합산 불일치 경고 (3% 이상) */}
          {discrepancy > 3 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              {lang === 'ko'
                ? `⚠ 항목 합산(${fmtTpd(derivedTotal)} $/tpd)이 총 CapEx(${fmtTpd(capexPerTpd)} $/tpd)와 ${discrepancy.toFixed(1)}% 차이. 합산값 적용 중.`
                : `⚠ Breakdown sum (${fmtTpd(derivedTotal)} $/tpd) differs from total CapEx (${fmtTpd(capexPerTpd)} $/tpd) by ${discrepancy.toFixed(1)}%. Using sum.`}
            </p>
          )}

          <MiniInput
            label={lang === 'ko' ? '개질기 (Reformer/Reactor)' : 'Reformer / Reactor'}
            value={breakdown.reformer}
            onChange={(v) => handleL1Change('reformer', v)}
            hint="$/tpd"
            step={100000}
          />
          <MiniInput
            label={lang === 'ko' ? '가스 정제 (Gas Cleanup / PSA)' : 'Gas Cleanup / PSA'}
            value={breakdown.gasCleanup}
            onChange={(v) => handleL1Change('gasCleanup', v)}
            hint="$/tpd"
            step={100000}
          />
          {isCcs && (
            <MiniInput
              label={lang === 'ko' ? 'CCS 설비 (포집·압축·주입)' : 'CCS (Capture, Compression, Injection)'}
              value={breakdown.ccs}
              onChange={(v) => handleL1Change('ccs', v)}
              hint="$/tpd"
              step={100000}
            />
          )}
          <MiniInput
            label={lang === 'ko' ? '유틸리티 (Utilities / BOP)' : 'Utilities / BOP'}
            value={breakdown.utilities}
            onChange={(v) => handleL1Change('utilities', v)}
            hint="$/tpd"
            step={100000}
          />
          <MiniInput
            label={lang === 'ko' ? 'EPC (설계·시공·시운전)' : 'EPC (Engineering, Construction)'}
            value={breakdown.epc}
            onChange={(v) => handleL1Change('epc', v)}
            hint="$/tpd"
            step={100000}
          />

          {/* 합계 표시 */}
          <div className="text-xs font-medium text-blue-700 flex justify-between border-t border-blue-100 pt-1 mt-1">
            <span>{lang === 'ko' ? '▶ 합산 CapEx' : '▶ Derived CapEx'}</span>
            <span>{fmtTpd(derivedTotal)} $/tpd</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniInput({
  label, value, onChange, hint, step = 10, highlight = false,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint: string
  step?: number
  highlight?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <label className={`block text-xs leading-snug ${highlight ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400 shrink-0 w-8">{hint}</span>
      </div>
    </div>
  )
}
