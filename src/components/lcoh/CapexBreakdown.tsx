'use client'

import { useState } from 'react'
import type { PathwayId, Lang } from '@/lib/lcoh/types'
import type { Translations } from '@/lib/i18n/ko'
import { PEM_CAPEX_REFS, ALK_CAPEX_REFS, AEM_CAPEX_REFS, SOEC_CAPEX_REFS } from '@/lib/lcoh/capex-references'
import type { ElectrolyzerCapexRef } from '@/lib/lcoh/capex-references'

interface ElectrolyzerBreakdown {
  // Level 1
  electrolyzerSystem: number   // $/kW
  bop: number                  // $/kW
  epc: number                  // $/kW
  contingency: number          // %
  // Level 2
  stack: number                // $/kW
  bos: number                  // $/kW
}

interface Props {
  pathway: PathwayId
  capex: number                // 현재 Level 0 값 ($/kW)
  onCapexChange: (v: number) => void
  lang: Lang
  t: Translations
}

function getRefsByPathway(pathway: PathwayId): ElectrolyzerCapexRef[] {
  switch (pathway) {
    case 'alk': return ALK_CAPEX_REFS
    case 'aem': return AEM_CAPEX_REFS
    case 'soec': return SOEC_CAPEX_REFS
    default: return PEM_CAPEX_REFS
  }
}

export default function CapexBreakdown({ pathway, capex, onCapexChange, lang, t }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [expandedL2, setExpandedL2] = useState(false)
  const [selectedRefId, setSelectedRefId] = useState('custom')
  const refs = getRefsByPathway(pathway)

  // Level 1 state (초기값: 선택된 레퍼런스 또는 capex 비율 추정)
  const defaultL1 = (): ElectrolyzerBreakdown => {
    const ref = refs[0]  // IEA 기본
    if (ref.electrolyzerSystem && ref.bop && ref.epc && ref.contingency) {
      return {
        electrolyzerSystem: ref.electrolyzerSystem,
        bop: ref.bop,
        epc: ref.epc,
        contingency: ref.contingency,
        stack: ref.stack ?? Math.round(ref.electrolyzerSystem * 0.58),
        bos: ref.bos ?? Math.round(ref.electrolyzerSystem * 0.42),
      }
    }
    // fallback: capex 비율로 추정
    return {
      electrolyzerSystem: Math.round(capex * 0.55),
      bop: Math.round(capex * 0.28),
      epc: Math.round(capex * 0.17),
      contingency: 10,
      stack: Math.round(capex * 0.55 * 0.58),
      bos: Math.round(capex * 0.55 * 0.42),
    }
  }

  const [breakdown, setBreakdown] = useState<ElectrolyzerBreakdown>(defaultL1)

  // Level 1 합산 (예비비 포함)
  const subtotal = breakdown.electrolyzerSystem + breakdown.bop + breakdown.epc
  const derivedTotal = Math.round(subtotal * (1 + breakdown.contingency / 100))
  const discrepancy = capex > 0 ? Math.abs(derivedTotal - capex) / capex * 100 : 0

  // 레퍼런스 선택 시 값 자동 입력
  const handleRefChange = (refId: string) => {
    setSelectedRefId(refId)
    const ref = refs.find(r => r.id === refId)
    if (!ref) return
    if (refId === 'custom') {
      // 직접입력: 현재 값 유지
      return
    }
    // Level 0 반영
    onCapexChange(ref.totalCapex)
    // Level 1 반영 (있는 경우)
    if (ref.electrolyzerSystem && ref.bop && ref.epc && ref.contingency) {
      setBreakdown(prev => ({
        ...prev,
        electrolyzerSystem: ref.electrolyzerSystem!,
        bop: ref.bop!,
        epc: ref.epc!,
        contingency: ref.contingency!,
        stack: ref.stack ?? Math.round(ref.electrolyzerSystem! * 0.58),
        bos: ref.bos ?? Math.round(ref.electrolyzerSystem! * 0.42),
      }))
    }
  }

  // Level 1 변경 시 합산 → Level 0 자동 업데이트
  const handleL1Change = (key: keyof ElectrolyzerBreakdown, value: number) => {
    const next = { ...breakdown, [key]: value }
    setBreakdown(next)
    const sub = next.electrolyzerSystem + next.bop + next.epc
    onCapexChange(Math.round(sub * (1 + next.contingency / 100)))
  }

  // Level 2 변경 시 electrolyzerSystem 자동 업데이트
  const handleL2Change = (key: 'stack' | 'bos', value: number) => {
    const next = { ...breakdown, [key]: value }
    const newElecSystem = next.stack + next.bos
    next.electrolyzerSystem = newElecSystem
    setBreakdown(next)
    const sub = newElecSystem + next.bop + next.epc
    onCapexChange(Math.round(sub * (1 + next.contingency / 100)))
  }

  const selectedRefObj = refs.find(r => r.id === selectedRefId)

  return (
    <div className="space-y-2">
      {/* Level 0: 레퍼런스 선택 + 단일값 */}
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
        <div className="flex items-center gap-2">
          {selectedRefObj && selectedRefObj.totalCapexLow && selectedRefObj.totalCapexHigh && (
            <span className="text-xs text-gray-400">
              {selectedRefObj.totalCapexLow}~{selectedRefObj.totalCapexHigh} $/kW
            </span>
          )}
          {selectedRefObj && selectedRefObj.source && selectedRefObj.id !== 'custom' && (
            <span className="text-xs text-gray-400 italic truncate max-w-[160px]" title={selectedRefObj.source}>
              {selectedRefObj.source}
            </span>
          )}
        </div>
      </div>

      {/* Level 0 입력 */}
      <input
        type="number"
        value={capex}
        step={50}
        min={100}
        readOnly={expanded}
        onChange={(e) => {
          if (!expanded) {
            onCapexChange(parseFloat(e.target.value) || 0)
            setSelectedRefId('custom')
          }
        }}
        className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
          expanded
            ? 'border-gray-200 bg-gray-50 text-gray-500 focus:ring-gray-300 cursor-not-allowed'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {expanded && (
        <p className="text-xs text-blue-600 mt-0.5">
          {lang === 'ko' ? '※ 항목 합산값 자동 반영' : '※ Auto-calculated from breakdown'}
        </p>
      )}

      {/* Level 1 펼치기 버튼 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <span>{expanded ? '▲' : '▼'}</span>
        <span>{lang === 'ko' ? '항목별로 나눠서 입력' : 'Enter cost breakdown'}</span>
      </button>

      {expanded && (
        <div className="ml-2 space-y-2 border-l-2 border-blue-100 pl-3">
          {/* 합계 불일치 경고 */}
          {discrepancy > 3 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              {lang === 'ko'
                ? `⚠ 항목 합산(${derivedTotal} $/kW)이 총 CapEx(${capex} $/kW)와 ${discrepancy.toFixed(1)}% 차이. 합산값 적용 중.`
                : `⚠ Breakdown sum (${derivedTotal} $/kW) differs from total CapEx (${capex} $/kW) by ${discrepancy.toFixed(1)}%. Using sum.`}
            </p>
          )}

          {/* Level 2 펼치기 버튼 */}
          <button
            type="button"
            onClick={() => setExpandedL2(!expandedL2)}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <span>{expandedL2 ? '▲' : '▼'}</span>
            <span>{lang === 'ko' ? '스택/BOS 분리 입력' : 'Split Stack / BOS'}</span>
          </button>

          {expandedL2 && (
            <div className="ml-2 space-y-1 border-l-2 border-green-100 pl-3">
              <MiniInput
                label={lang === 'ko' ? '스택 (Stack)' : 'Stack'}
                value={breakdown.stack}
                onChange={(v) => handleL2Change('stack', v)}
                hint="$/kW"
              />
              <MiniInput
                label={lang === 'ko' ? '스택 BOS (정류기·펌프·제어)' : 'Stack BOS (Rectifier, Pump, Control)'}
                value={breakdown.bos}
                onChange={(v) => handleL2Change('bos', v)}
                hint="$/kW"
              />
              <div className="text-xs text-gray-500 flex justify-between">
                <span>{lang === 'ko' ? '소계 (= 전해조 시스템)' : 'Subtotal (= Electrolyzer System)'}</span>
                <span className="font-medium">{breakdown.stack + breakdown.bos} $/kW</span>
              </div>
            </div>
          )}

          <MiniInput
            label={lang === 'ko' ? '전해조 시스템 (스택+BOS)' : 'Electrolyzer System (Stack+BOS)'}
            value={breakdown.electrolyzerSystem}
            onChange={(v) => handleL1Change('electrolyzerSystem', v)}
            hint="$/kW"
            highlight={expandedL2}  // Level 2 열릴 때 연동 표시
          />
          <div>
            <MiniInput
              label={lang === 'ko' ? 'BOP (전력공급·냉각·수처리)' : 'BOP (Power Supply, Cooling, Water)'}
              value={breakdown.bop}
              onChange={(v) => handleL1Change('bop', v)}
              hint="$/kW"
            />
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1" title={t.lcoh3.bopRefTooltip}>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              <span>{t.lcoh3.bopRefTooltip}</span>
            </p>
          </div>
          <MiniInput
            label={lang === 'ko' ? 'EPC (설계·시공·시운전)' : 'EPC (Engineering, Construction)'}
            value={breakdown.epc}
            onChange={(v) => handleL1Change('epc', v)}
            hint="$/kW"
          />
          <MiniInput
            label={lang === 'ko' ? '예비비 (Contingency)' : 'Contingency'}
            value={breakdown.contingency}
            onChange={(v) => handleL1Change('contingency', v)}
            hint="%"
            step={1}
          />

          {/* 합계 표시 */}
          <div className="text-xs font-medium text-blue-700 flex justify-between border-t border-blue-100 pt-1 mt-1">
            <span>{lang === 'ko' ? '▶ 합산 CapEx' : '▶ Derived CapEx'}</span>
            <span>{derivedTotal} $/kW</span>
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
