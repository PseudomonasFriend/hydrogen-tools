import { describe, it, expect } from 'vitest'
import { convertFromUSD, formatCurrency, FALLBACK_RATES, CURRENCIES } from '../currency'
import type { CurrencyInfo } from '../currency'

// ── FALLBACK_RATES ────────────────────────────────────────────────────────
describe('FALLBACK_RATES', () => {
  it('USD는 1이어야 한다', () => {
    expect(FALLBACK_RATES.USD).toBe(1)
  })

  it('KRW는 현실적인 범위 (500~3000)', () => {
    expect(FALLBACK_RATES.KRW).toBeGreaterThan(500)
    expect(FALLBACK_RATES.KRW).toBeLessThan(3000)
  })

  it('EUR은 현실적인 범위 (0.5~2.0)', () => {
    expect(FALLBACK_RATES.EUR).toBeGreaterThan(0.5)
    expect(FALLBACK_RATES.EUR).toBeLessThan(2.0)
  })

  it('JPY는 현실적인 범위 (50~500)', () => {
    expect(FALLBACK_RATES.JPY).toBeGreaterThan(50)
    expect(FALLBACK_RATES.JPY).toBeLessThan(500)
  })
})

// ── convertFromUSD ───────────────────────────────────────────────────────
describe('convertFromUSD', () => {
  it('rate 1이면 원본 값 반환 (USD→USD)', () => {
    expect(convertFromUSD(100, 1)).toBe(100)
  })

  it('rate 1430이면 KRW로 변환', () => {
    expect(convertFromUSD(1, 1430)).toBe(1430)
  })

  it('0 USD → 0', () => {
    expect(convertFromUSD(0, 1430)).toBe(0)
  })

  it('음수값도 변환됨', () => {
    expect(convertFromUSD(-10, 2)).toBe(-20)
  })

  it('소수점 처리', () => {
    expect(convertFromUSD(3.5, 0.92)).toBeCloseTo(3.22, 5)
  })
})

// ── formatCurrency ───────────────────────────────────────────────────────
describe('formatCurrency', () => {
  const usd: CurrencyInfo = CURRENCIES.find(c => c.code === 'USD')!
  const krw: CurrencyInfo = CURRENCIES.find(c => c.code === 'KRW')!
  const eur: CurrencyInfo = CURRENCIES.find(c => c.code === 'EUR')!
  const jpy: CurrencyInfo = CURRENCIES.find(c => c.code === 'JPY')!

  it('USD: 소수점 2자리', () => {
    const result = formatCurrency(1.5, usd)
    expect(result).toContain('1.50')
  })

  it('KRW: 소수점 없음', () => {
    const result = formatCurrency(1430, krw)
    expect(result).not.toContain('.')
  })

  it('EUR: 소수점 2자리', () => {
    const result = formatCurrency(0.92, eur)
    expect(result).toContain('0.92')
  })

  it('JPY: 소수점 없음', () => {
    const result = formatCurrency(149, jpy)
    expect(result).not.toContain('.')
  })

  it('큰 수 포맷팅 (천단위 구분자)', () => {
    const result = formatCurrency(1_000_000, usd)
    expect(result).toContain(',')
  })

  it('0 포맷팅', () => {
    const result = formatCurrency(0, usd)
    expect(result).toBe('0.00')
  })
})

// ── CURRENCIES 메타데이터 ────────────────────────────────────────────────
describe('CURRENCIES', () => {
  it('4개 통화 정의', () => {
    expect(CURRENCIES).toHaveLength(4)
  })

  it('USD 심볼은 $', () => {
    expect(CURRENCIES.find(c => c.code === 'USD')?.symbol).toBe('$')
  })

  it('KRW 심볼은 ₩', () => {
    expect(CURRENCIES.find(c => c.code === 'KRW')?.symbol).toBe('₩')
  })

  it('모든 통화에 code/symbol/name/decimals 존재', () => {
    CURRENCIES.forEach(c => {
      expect(c.code).toBeTruthy()
      expect(c.symbol).toBeTruthy()
      expect(c.name).toBeTruthy()
      expect(typeof c.decimals).toBe('number')
    })
  })
})
