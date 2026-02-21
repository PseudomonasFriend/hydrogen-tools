import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
 const baseUrl = 'https://web-kappa-navy.vercel.app'
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
 const entries: MetadataRoute.Sitemap = langs.flatMap((lang) =>
 routes.map((route) => ({
  url: route.path ? `${baseUrl}/${lang}/${route.path}` : `${baseUrl}/${lang}`,
 lastModified: now,
 changeFrequency: 'weekly' as const,
 priority: route.priority,
 }))
 )
 return entries
}

