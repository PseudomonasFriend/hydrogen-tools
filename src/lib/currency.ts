// 지원 통화
export type CurrencyCode = 'USD' | 'KRW' | 'EUR' | 'JPY'

export interface CurrencyInfo {
  code: CurrencyCode
  symbol: string
  name: string
  decimals: number  // 표시 소수점 자리수
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$',  name: 'USD', decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'KRW', decimals: 0 },
  { code: 'EUR', symbol: '€', name: 'EUR', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'JPY', decimals: 0 },
]

// 기본 fallback 환율 (1 USD 기준, 2025년 Q1 시장가 참고)
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  KRW: 1430,
  EUR: 0.92,
  JPY: 149,
}

// 환율 fetch: open.er-api.com
export async function fetchExchangeRates(): Promise<Record<CurrencyCode, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('rate fetch failed')
    const data = await res.json() as { rates: Record<string, number> }
    return {
      USD: 1,
      KRW: data.rates['KRW'] ?? FALLBACK_RATES.KRW,
      EUR: data.rates['EUR'] ?? FALLBACK_RATES.EUR,
      JPY: data.rates['JPY'] ?? FALLBACK_RATES.JPY,
    }
  } catch {
    return { ...FALLBACK_RATES }
  }
}

// USD → 대상 통화 변환
export function convertFromUSD(usdValue: number, rate: number): number {
  return usdValue * rate
}

// 금액 포맷팅
export function formatCurrency(value: number, currency: CurrencyInfo): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })
}
