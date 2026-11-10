'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, relativeTime, type Article, type ArticleStatus } from '@blog/core'
import { Badge, Button, Empty, Input } from '@blog/ui'
import {
  createArticle,
  deleteArticle,
  downloadText,
  duplicateArticle,
  importMarkdown,
  listArticles,
  toMarkdownFile,
} from '@/lib/articles'
import { logError } from '@/lib/errors'
import { STATUS_LABEL, STATUS_TONE } from '@/features/articles/status'

const FILTERS: Array<{ value: 'all' | ArticleStatus; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'publishing', label: '发布中' },
  { value: 'publish_failed', label: '发布失败' },
]

export default function ArticleListPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'all' | ArticleStatus>('all')
  const [tag, setTag] = useState('all')
  const [sort, setSort] = useState<'updated' | 'date'>('updated')
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    const rows = await listArticles()
    setArticles(rows)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const article of articles) for (const item of article.tags) set.add(item)
    return [...set].sort()
  }, [articles])

  const filtered = useMemo(() => {
    const list = articles.filter((article) => {
      if (status !== 'all' && article.status !== status) return false
      if (tag !== 'all' && !article.tags.includes(tag)) return false
      if (keyword) {
        const haystack = `${article.title} ${article.slug} ${article.summary} ${article.tags.join(' ')}`.toLowerCase()
        if (!haystack.includes(keyword.toLowerCase())) return false
      }
      return true
    })
    return list.sort((a, b) => {
      if (sort === 'date') return b.date.localeCompare(a.date)
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [articles, status, tag, sort, keyword])

  async function handleCreate() {
    setBusy(true)
    try {
      const article = await createArticle()
      router.push(`/app/articles/editor/?id=${article.id}`)
    } catch (cause) {
      await logError('articles.create', cause)
      setError('创建文章失败，请检查浏览器存储空间')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    setBusy(true)
    setError(null)
    try {
      const text = await file.text()
      const article = await importMarkdown(text)
      await refresh()
      router.push(`/app/articles/editor/?id=${article.id}`)
    } catch (cause) {
      await logError('articles.import', cause)
      setError('导入失败，请确认文件是 Markdown 文本')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDuplicate(article: Article) {
    setBusy(true)
    try {
      await duplicateArticle(article.id)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(article: Article) {
    const confirmed = window.confirm(`删除《${article.title}》？该操作不可撤销，已发布文章不会从线上移除。`)
    if (!confirmed) return
    setBusy(true)
    try {
      await deleteArticle(article.id)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">文章</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">草稿只存本地；发布后进入仓库并触发构建。</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImport(file)
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            导入 Markdown
          </Button>
          <Button variant="primary" onClick={handleCreate} loading={busy}>
            新建文章
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={`rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-xs transition ${
                status === item.value
                  ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          className="h-9 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
        >
          <option value="all">全部标签</option>
          {allTags.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as 'updated' | 'date')}
          className="h-9 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
        >
          <option value="updated">按更新时间</option>
          <option value="date">按发布日期</option>
        </select>
        <div className="ml-auto w-full sm:w-56">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题、slug、标签"
            className="h-9 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">正在读取本地数据…</p>
      ) : filtered.length === 0 ? (
        <Empty
          title={articles.length === 0 ? '还没有文章' : '没有符合条件的文章'}
          description={articles.length === 0 ? '新建一篇，或导入已有的 Markdown 文件。' : '换一个筛选条件试试。'}
          action={
            articles.length === 0 ? (
              <Button variant="primary" onClick={handleCreate}>
                新建文章
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {filtered.map((article) => (
            <li key={article.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/articles/editor/?id=${article.id}`}
                    className="truncate text-sm font-medium hover:text-[var(--color-accent)]"
                  >
                    {article.title}
                  </Link>
                  {article.hasUnpublishedChanges ? (
                    <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                      有未发布修改
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-subtle)]">
                  <span className="font-mono">{article.slug}</span>
                  <span>·</span>
                  <span>{formatDate(article.date)}</span>
                  <span>·</span>
                  <span>更新于 {relativeTime(article.updatedAt)}</span>
                  {article.tags.length > 0 ? (
                    <>
                      <span>·</span>
                      <span>{article.tags.join(' / ')}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[article.status]}>{STATUS_LABEL[article.status]}</Badge>
                <Link
                  href={`/app/articles/editor/?id=${article.id}`}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  编辑
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDuplicate(article)}
                  disabled={busy}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  复制
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(`${article.slug}.md`, toMarkdownFile(article))}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  导出
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(article)}
                  disabled={busy}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-danger)] hover:border-red-300"
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
