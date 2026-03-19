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
  const [isFallback, setIsFallback] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const r = await fetchExchangeRates()
        setRates(r)
        // FALLBACK_RATES와 KRW/EUR 모두 동일하면 실제 fetch 실패로 간주
        const usedFallback = r.KRW === FALLBACK_RATES.KRW && r.EUR === FALLBACK_RATES.EUR
        setIsFallback(usedFallback)
        setLastUpdated(usedFallback ? null : new Date().toLocaleTimeString())
      } catch {
        setIsFallback(true)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
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
    isFallback,
    convert, currencyInfo,
  }
}
