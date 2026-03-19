// GA4 이벤트 추적 유틸리티
// 환경변수 NEXT_PUBLIC_GA4_ID 가 없으면 no-op

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined' || !window.gtag) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.gtag(...(args as [string, ...any[]]))
}

/** 페이지뷰 (SPA 라우팅 시 수동 호출) */
export function trackPageView(url: string): void {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID
  if (!gaId) return
  gtag('config', gaId, { page_path: url })
}

/** LCOH 계산 실행 이벤트 */
export function trackCalculatorRun(params: {
  tier: 1 | 2 | 3
  pathway: string
  lang: string
}): void {
  gtag('event', 'calculator_calculate', {
    event_category: 'calculator',
    tier: params.tier,
    pathway: params.pathway,
    language: params.lang,
  })
}

/** 경로 변경 이벤트 */
export function trackPathwayChange(pathway: string, tier: 1 | 2 | 3): void {
  gtag('event', 'pathway_change', {
    event_category: 'calculator',
    pathway,
    tier,
  })
}

/** 화폐 단위 변경 이벤트 */
export function trackCurrencyChange(currency: string): void {
  gtag('event', 'currency_change', {
    event_category: 'calculator',
    currency_code: currency,
  })
}

/** Excel 모델 CTA 클릭 이벤트 */
export function trackExcelCtaClick(tier: string, lang: string): void {
  gtag('event', 'excel_cta_click', {
    event_category: 'conversion',
    tier,
    language: lang,
  })
}

/** 언어 전환 이벤트 */
export function trackLanguageSwitch(from: string, to: string): void {
  gtag('event', 'language_switch', {
    event_category: 'ui',
    from_lang: from,
    to_lang: to,
  })
}
