import type { MetadataRoute } from 'next'
import { getConfig, getPosts } from '@/lib/content'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const { site } = getConfig()
  const base = site.url.replace(/\/+$/, '')
  const posts = getPosts()

  const staticRoutes: MetadataRoute.Sitemap = ['', 'tags/', 'archive/', 'about/'].map((path) => ({
    url: `${base}/${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/posts/${post.slug}/`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...postRoutes]
}
