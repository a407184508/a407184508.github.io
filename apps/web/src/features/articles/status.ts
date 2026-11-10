import type { ArticleStatus } from '@blog/core'

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: '草稿',
  publishing: '发布中',
  published: '已发布',
  publish_failed: '发布失败',
}

export const STATUS_TONE: Record<ArticleStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'accent'> = {
  draft: 'neutral',
  publishing: 'accent',
  published: 'success',
  publish_failed: 'danger',
}
