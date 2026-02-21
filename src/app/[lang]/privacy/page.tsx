import type { Lang } from '@/lib/lcoh/types'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'

const translations = { ko, en }

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = translations[(lang as Lang)] ?? ko
  const isKo = lang === 'ko'
  
  const collectItems = isKo ? ["이용 통계 정보: Google Analytics를 통해 익명화된 방문 통계를 수집합니다.","쿠키: 서비스 이용 편의를 위해 쿠키를 사용합니다. 브라우저 설정에서 비활성화 가능합니다.","광고: Google AdSense를 통해 광고가 표시될 수 있으며 Google이 쿠키를 사용할 수 있습니다.","입력 데이터: 계산기에 입력한 파라미터는 서버에 저장되지 않고 브라우저 내에서만 처리됩니다."] : ["Usage statistics: Anonymous visit statistics collected via Google Analytics.","Cookies: We may use cookies for service convenience. You can disable them in browser settings.","Advertising: Ads may be shown via Google AdSense; Google may use cookies for ad personalization.","Input data: Parameters entered in the calculator are not stored on servers; processed locally in your browser."]
  const useItems = isKo ? ["서비스 품질 개선 및 사용자 경험 최적화","서비스 이용 통계 분석","광고 게재 및 광고 효과 측정 (Google AdSense)"] : ["Improving service quality and optimizing user experience","Analyzing service usage statistics","Displaying ads and measuring ad effectiveness (Google AdSense)"]
  const thirdItems = isKo ? ["Google Analytics: 익명화된 방문 통계. Google 개인정보방침 적용.","Google AdSense: 관심 기반 광고 게재. https://adssettings.google.com 에서 관리 가능."] : ["Google Analytics: Anonymous visit statistics. Subject to Google Privacy Policy.","Google AdSense: Interest-based advertising. Manage at https://adssettings.google.com."]

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.privacy.title}</h1>
        <p className="text-sm text-gray-500">{t.privacy.subtitle}</p>
        <p className="text-xs text-gray-400 mt-1">{t.privacy.lastUpdated}</p>
      </div>

      {/* 개요 */}
      <p className="text-gray-700 leading-relaxed">{t.privacy.intro}</p>

      {/* 섹션 헬퍼 컴포넌트는 인라인으로 표현 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.privacy.collectTitle}</h2>
        <ul className="space-y-2">
          {collectItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.privacy.useTitle}</h2>
        <ul className="space-y-2">
          {useItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.privacy.thirdPartyTitle}</h2>
        <ul className="space-y-2">
          {thirdItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gray-50 rounded-lg p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.privacy.cookieTitle}</h2>
        <p className="text-sm text-gray-700">{t.privacy.cookieDesc}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.privacy.rightsTitle}</h2>
        <p className="text-sm text-gray-700">{t.privacy.rightsDesc}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.privacy.retentionTitle}</h2>
        <p className="text-sm text-gray-700">{t.privacy.retentionDesc}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.privacy.changeTitle}</h2>
        <p className="text-sm text-gray-700">{t.privacy.changeDesc}</p>
      </section>

      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.privacy.contactTitle}</h2>
        <p className="text-sm text-gray-700">{t.privacy.contactDesc}</p>
      </section>
    </div>
  )
}
 
