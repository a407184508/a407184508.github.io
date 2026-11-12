'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, relativeTime, type Article } from '@blog/core'
import { Badge, Card } from '@blog/ui'
import { listArticles } from '@/lib/articles'
import { getLastBackupAt } from '@/lib/backup'
import { STATUS_LABEL, STATUS_TONE } from '@/features/articles/status'

interface Stats {
  total: number
  published: number
  drafts: number
  pending: number
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

export default function AppHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Article[]>([])
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null)
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const articles = await listArticles()
      setStats({
        total: articles.length,
        published: articles.filter((item) => item.status === 'published').length,
        drafts: articles.filter((item) => item.status === 'draft').length,
        pending: articles.filter((item) => item.hasUnpublishedChanges).length,
      })
      setRecent(articles.slice(0, 5))
      setLastBackup(await getLastBackupAt())
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        setUsage({ used: estimate.usage ?? 0, quota: estimate.quota ?? 0 })
      }
    }
    void load()
  }, [])

  const backupDays = daysSince(lastBackup)
  const usedMb = usage ? (usage.used / 1024 / 1024).toFixed(1) : '—'
  const quotaMb = usage ? Math.round(usage.quota / 1024 / 1024) : '—'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">概览</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">写一次，多平台使用：博客、公众号、长图。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-[var(--color-text-subtle)]">文章总数</p>
          <p className="mt-2 text-2xl font-semibold">{stats?.total ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-subtle)]">已发布</p>
          <p className="mt-2 text-2xl font-semibold">{stats?.published ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-subtle)]">草稿</p>
          <p className="mt-2 text-2xl font-semibold">{stats?.drafts ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-subtle)]">有未发布修改</p>
          <p className="mt-2 text-2xl font-semibold">{stats?.pending ?? '—'}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">最近编辑</h2>
            <Link href="/app/articles/" className="text-xs text-[var(--color-accent)]">
              全部文章 →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              还没有文章，
              <Link href="/app/articles/" className="text-[var(--color-accent)]">
                去写第一篇
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {recent.map((article) => (
                <li key={article.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <Link
                      href={`/app/articles/editor/?id=${article.id}`}
                      className="block truncate text-sm font-medium hover:text-[var(--color-accent)]"
                    >
                      {article.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--color-text-subtle)]">
                      {formatDate(article.date)} · 更新于 {relativeTime(article.updatedAt)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[article.status]}>{STATUS_LABEL[article.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">本地存储</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              已用 {usedMb} MB / 配额 {quotaMb} MB
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{
                  width: usage && usage.quota > 0 ? `${Math.min(100, (usage.used / usage.quota) * 100)}%` : '0%',
                }}
              />
            </div>
            <Link href="/app/settings/" className="text-xs text-[var(--color-accent)]">
              导出备份 / 管理连接 →
            </Link>
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">备份提醒</h2>
            {backupDays === null ? (
              <p className="text-xs text-[var(--color-text-muted)]">还没有导出过备份，建议先导出一份完整备份。</p>
            ) : backupDays > 30 ? (
              <p className="text-xs text-[var(--color-danger)]">已 {backupDays} 天未备份，请尽快导出。</p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">上次备份：{backupDays} 天前。</p>
            )}
            <Link href="/app/settings/" className="text-xs text-[var(--color-accent)]">
              前往备份 →
            </Link>
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">创作工具</h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/app/tools/cover/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                封面设计 →
              </Link>
              <Link href="/app/tools/wechat/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                公众号排版 →
              </Link>
              <Link href="/app/tools/longimage/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]">
                长图导出 →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
