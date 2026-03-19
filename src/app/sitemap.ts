import type { MetadataRoute } from 'next'

const BASE_URL = 'https://web-kappa-navy.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const langs = ['ko', 'en']
  const now = new Date()

  const routes = [
    { path: '', priority: 1.0 },
    { path: 'lcoh', priority: 0.9 },
    { path: 'lcoh/tier2', priority: 0.9 },
    { path: 'lcoh/tier3', priority: 0.9 },
    { path: 'about', priority: 0.8 },
    { path: 'privacy', priority: 0.5 },
  ]

  return langs.flatMap((lang) =>
    routes.map((route) => ({
      url: route.path ? `${BASE_URL}/${lang}/${route.path}` : `${BASE_URL}/${lang}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: route.priority,
    }))
  )
}

