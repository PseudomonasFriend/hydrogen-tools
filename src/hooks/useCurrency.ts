'use client'
import { useState, useEffect } from 'react'
import type { CurrencyCode } from '@/lib/currency'
import { FALLBACK_RATES, fetchExchangeRates, CURRENCIES } from '@/lib/currency'

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES)
  const [customRate, setCustomRate] = useState<number | null>(null)  // null = 실시간 사용
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetchExchangeRates().then(r => {
      setRates(r)
      setLastUpdated(new Date().toLocaleTimeString())
    }).finally(() => setIsLoading(false))
  }, [])

  // 실제 적용 환율: customRate 있으면 우선 사용
  const activeRate = currency === 'USD' ? 1 : (customRate ?? rates[currency])

  const convert = (usdValue: number): number => usdValue * activeRate

  const currencyInfo = CURRENCIES.find(c => c.code === currency)!

  return {
    currency, setCurrency,
    rates, activeRate,
    customRate, setCustomRate,
    isLoading, lastUpdated,
    convert, currencyInfo,
  }
}
