import { SITE_TIMEZONE } from './constants'

export function nowIso(): string {
  return new Date().toISOString()
}

export function formatDate(value: string | Date, locale = 'zh-CN'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('/', '-')
}

export function formatDateTime(value: string | Date, locale = 'zh-CN'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** 工作台“仅日期”记录使用的 YYYY-MM-DD。 */
export function toDateOnly(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts
}

export function isFutureDate(value: string): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() > Date.now()
}

export function relativeTime(value: string): string {
  const date = new Date(value).getTime()
  if (Number.isNaN(date)) return ''
  const diff = Date.now() - date
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(new Date(date))
}

/** 粗估阅读时间（分钟）：中文按字，英文按词。 */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~-]/g, ' ')
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) ?? []).length
  return Math.max(1, Math.round((cjk + words / 2) / 300))
}
