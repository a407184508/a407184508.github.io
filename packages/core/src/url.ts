const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^msclkid$/i,
  /^spm$/i,
  /^yclid$/i,
  /^igshid$/i,
  /^ref_src$/i,
]

export interface NormalizeUrlOptions {
  stripTracking?: boolean
  stripHash?: boolean
  stripTrailingSlash?: boolean
}

/**
 * 资源库去重使用的 URL 归一化。
 * 返回空字符串表示无法解析为 http(s) 链接。
 */
export function normalizeUrl(raw: string, options: NormalizeUrlOptions = {}): string {
  const { stripTracking = true, stripHash = true, stripTrailingSlash = true } = options
  const trimmed = raw.trim()
  if (!trimmed) return ''
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return ''
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
  url.hostname = url.hostname.toLowerCase()
  if (stripHash) url.hash = ''
  if (stripTracking) {
    const keys = [...url.searchParams.keys()]
    for (const key of keys) {
      if (TRACKING_PARAMS.some((pattern) => pattern.test(key))) {
        url.searchParams.delete(key)
      }
    }
  }
  let pathname = url.pathname
  if (stripTrailingSlash && pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, '')
  }
  url.pathname = pathname
  return url.toString()
}

export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

/** 配置中的 href 只允许站内绝对路径或 https 外链。 */
export function isSafeHref(href: string): boolean {
  if (isInternalHref(href)) return true
  try {
    const url = new URL(href)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function withTrailingSlash(path: string): string {
  if (!path.startsWith('/')) return path
  if (path === '/') return path
  if (path.endsWith('/')) return path
  return `${path}/`
}
