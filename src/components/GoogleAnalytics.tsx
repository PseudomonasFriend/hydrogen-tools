// GA4 gtag.js 스크립트 컴포넌트 (루트 layout에서 한 번만 렌더)
// NEXT_PUBLIC_GA4_ID 환경변수가 없으면 렌더하지 않음

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID

export default function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  )
}
