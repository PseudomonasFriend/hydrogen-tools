'use client'
import { useState } from 'react'
import type { CurrencyCode } from '@/lib/currency'
import { CURRENCIES } from '@/lib/currency'
import type { Translations } from '@/lib/i18n/ko'

interface Props {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  rates: Record<CurrencyCode, number>
  customRate: number | null
  setCustomRate: (r: number | null) => void
  isLoading: boolean
  lastUpdated: string | null
  t?: Translations
}

export default function CurrencySelector({
  currency, setCurrency, rates, customRate, setCustomRate, isLoading, lastUpdated, t,
}: Props) {
  const [useCustom, setUseCustom] = useState(false)
  const currentRate = customRate ?? rates[currency]

  const label = t?.currency.label ?? 'Currency'
  const customInputLabel = t?.currency.customInput ?? 'Custom'
  const loadingText = t?.currency.loading ?? 'Loading rates...'
  const ratePrefix = t?.currency.ratePrefix ?? '1 USD ='
  const rateSuffix = t?.currency.rateSuffix ?? 'as of'

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-xs text-gray-500">{label}:</span>
      {CURRENCIES.map(c => (
        <button
          key={c.code}
          onClick={() => { setCurrency(c.code); setCustomRate(null); setUseCustom(false) }}
          className={`px-2 py-0.5 text-xs rounded border transition-colors ${
            currency === c.code
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-blue-50'
          }`}
        >
          {c.symbol} {c.code}
        </button>
      ))}
      {currency !== 'USD' && (
        <span className="text-xs text-gray-500">
          {isLoading ? loadingText : `${ratePrefix} ${currentRate.toLocaleString()} ${currency}`}
          {lastUpdated && !isLoading && <span className="ml-1 text-gray-400">({rateSuffix} {lastUpdated})</span>}
        </span>
      )}
      {currency !== 'USD' && (
        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={e => {
              setUseCustom(e.target.checked)
              if (!e.target.checked) setCustomRate(null)
              else setCustomRate(rates[currency])
            }}
          />
          {customInputLabel}
        </label>
      )}
      {useCustom && currency !== 'USD' && (
        <input
          type="number"
          value={customRate ?? rates[currency]}
          step={1}
          onChange={e => setCustomRate(parseFloat(e.target.value) || null)}
          className="w-24 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  )
}
