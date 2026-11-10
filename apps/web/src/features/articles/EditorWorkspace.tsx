'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  detectSensitive,
  extractAssetIds,
  formatDateTime,
  isFutureDate,
  nowIso,
  relativeTime,
  toSlug,
  type Article,
  type PublishJob,
} from '@blog/core'
import { Badge, Button, Field, Input, Textarea } from '@blog/ui'
import { downloadText, getArticle, saveArticle, toMarkdownFile } from '@/lib/articles'
import { saveAsset, useAssetUrls } from '@/lib/assets'
import { crashKey, deleteSetting, getSetting, setSetting } from '@/lib/settings'
import { logError } from '@/lib/errors'
import { useAutosave } from '@/lib/useAutosave'
import { useEditLock } from '@/lib/editorLock'
import type { CrashSnapshot } from '@/lib/db'
import {
  getLatestJob,
  publishArticle,
  PublishConflictError,
  refreshPublishJob,
  unpublishArticle,
} from './publish'
import { CodeEditor } from './CodeEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { STATUS_LABEL, STATUS_TONE } from './status'

const JOB_LABEL: Record<PublishJob['status'], string> = {
  queued: '排队中',
  building: '构建中',
  success: '构建成功',
  failed: '构建失败',
}

function toLocalInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string, fallback: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function EditorWorkspace({ article: initialArticle }: { article: Article }) {
  const [article, setArticle] = useState(initialArticle)
  const [title, setTitle] = useState(initialArticle.title)
  const [slug, setSlug] = useState(initialArticle.slug)
  const [slugTouched, setSlugTouched] = useState(true)
  const [summary, setSummary] = useState(initialArticle.summary)
  const [tagsText, setTagsText] = useState(initialArticle.tags.join(', '))
  const [dateLocal, setDateLocal] = useState(() => toLocalInput(initialArticle.date))
  const [content, setContent] = useState(initialArticle.content)
  const [coverAssetId, setCoverAssetId] = useState<string | null>(initialArticle.coverAssetId)

  const [snapshot, setSnapshot] = useState<CrashSnapshot | null>(null)
  const [job, setJob] = useState<PublishJob | null>(null)
  const [showPublish, setShowPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [conflictPath, setConflictPath] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const lock = useEditLock(article.id)
  const readOnly = lock.status === 'readonly'

  useEffect(() => {
    async function load() {
      const crash = await getSetting<CrashSnapshot>(crashKey(initialArticle.id))
      if (!crash) return
      if (crash.content === initialArticle.content && crash.title === initialArticle.title) {
        await deleteSetting(crashKey(initialArticle.id))
        return
      }
      setSnapshot(crash)
    }
    void load()
    void getLatestJob(initialArticle.id).then(setJob)
  }, [initialArticle.id, initialArticle.content, initialArticle.title])

  const draftValue = useMemo(
    () => JSON.stringify({ title, slug, summary, tagsText, dateLocal, content, coverAssetId }),
    [title, slug, summary, tagsText, dateLocal, content, coverAssetId],
  )

  const autosave = useAutosave({
    value: draftValue,
    enabled: lock.status === 'owner',
    onSave: async (raw) => {
      const draft = JSON.parse(raw) as {
        title: string
        slug: string
        summary: string
        tagsText: string
        dateLocal: string
        content: string
        coverAssetId: string | null
      }
      const safeTitle = draft.title.trim() || '未命名文章'
      const safeSlug = draft.slug.trim() || toSlug(safeTitle, 'post')
      try {
        const saved = await saveArticle(initialArticle.id, {
          title: safeTitle,
          slug: safeSlug,
          summary: draft.summary,
          tags: parseTags(draft.tagsText),
          content: draft.content,
          coverAssetId: draft.coverAssetId,
          date: fromLocalInput(draft.dateLocal, initialArticle.date),
        })
        setArticle(saved)
        await setSetting(crashKey(initialArticle.id), {
          articleId: initialArticle.id,
          content: draft.content,
          title: draft.title,
          savedAt: nowIso(),
        } satisfies CrashSnapshot)
      } catch (cause) {
        await logError('editor.autosave', cause)
        throw new Error(
          /Constraint|unique/i.test(String(cause)) ? 'slug 已被其他文章占用' : '保存失败，请检查本地存储空间',
        )
      }
    },
  })

  const assetIds = useMemo(() => {
    const ids = new Set(extractAssetIds(content))
    if (coverAssetId) ids.add(coverAssetId)
    return [...ids]
  }, [content, coverAssetId])
  const assetUrls = useAssetUrls(assetIds)

  const findings = useMemo(() => detectSensitive(`${title}\n${summary}\n${content}`), [title, summary, content])

  const contentBytes = useMemo(() => new TextEncoder().encode(content).length, [content])

  // 构建状态轮询：页面可见时每 5 秒
  useEffect(() => {
    if (!job || (job.status !== 'building' && job.status !== 'queued')) return
    const tick = async () => {
      if (document.visibilityState !== 'visible') return
      const updated = await refreshPublishJob(job.id)
      if (!updated) return
      setJob(updated)
      if (updated.status === 'success' || updated.status === 'failed') {
        const latest = await getArticle(initialArticle.id)
        if (latest) setArticle(latest)
      }
    }
    void tick()
    const timer = setInterval(() => void tick(), 5000)
    return () => clearInterval(timer)
  }, [job?.id, job?.status, initialArticle.id])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(toSlug(value, 'post'))
  }

  async function handleImageFiles(files: File[]): Promise<string[]> {
    const snippets: string[] = []
    for (const file of files) {
      try {
        const asset = await saveAsset(file)
        snippets.push(`![图片](asset:${asset.id})`)
      } catch (cause) {
        await logError('editor.image', cause)
        setNotice('图片保存失败，可能是存储空间不足')
      }
    }
    return snippets
  }

  async function handleCoverFile(file: File) {
    try {
      const asset = await saveAsset(file)
      setCoverAssetId(asset.id)
    } catch (cause) {
      await logError('editor.cover', cause)
      setNotice('封面上传失败')
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      await autosave.flush()
      const result = await publishArticle(initialArticle.id, { overwriteRemote: Boolean(conflictPath) })
      setJob(result)
      setConflictPath(null)
      setShowPublish(false)
      setNotice('已提交发布，构建完成后会自动更新状态。')
      const latest = await getArticle(initialArticle.id)
      if (latest) setArticle(latest)
    } catch (cause) {
      if (cause instanceof PublishConflictError) {
        setConflictPath(cause.remotePath)
        setPublishError('远端已存在同名文章且不是本应用发布的记录，请确认后覆盖。')
      } else {
        setPublishError(cause instanceof Error ? cause.message : '发布失败')
      }
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    const confirmed = window.confirm('下线后线上文章与图片会被删除，本地文章回到草稿。确认继续？')
    if (!confirmed) return
    setPublishing(true)
    setPublishError(null)
    try {
      await unpublishArticle(initialArticle.id)
      const latest = await getArticle(initialArticle.id)
      if (latest) setArticle(latest)
      setNotice('已提交下线，构建完成后线上文章会消失。')
    } catch (cause) {
      setPublishError(cause instanceof Error ? cause.message : '下线失败')
    } finally {
      setPublishing(false)
    }
  }

  function handleRestoreSnapshot() {
    if (!snapshot) return
    setTitle(snapshot.title)
    setContent(snapshot.content)
    setSnapshot(null)
    setNotice('已恢复崩溃前的本地快照，请确认内容后保存。')
  }

  const saveText =
    autosave.state === 'saving'
      ? '保存中…'
      : autosave.state === 'error'
        ? autosave.error ?? '保存失败'
        : autosave.state === 'saved'
          ? '已保存'
          : '已就绪'

  const canPublish = title.trim().length > 0 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !isFutureDate(fromLocalInput(dateLocal, article.date))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/app/articles/"
          className="rounded-[var(--radius)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          ← 文章列表
        </Link>
        <Badge tone={STATUS_TONE[article.status]}>{STATUS_LABEL[article.status]}</Badge>
        {article.hasUnpublishedChanges ? (
          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">有未发布修改</span>
        ) : null}
        <span className={`text-xs ${autosave.state === 'error' ? 'text-red-600' : 'text-[var(--color-text-subtle)]'}`}>
          {saveText}
          {autosave.lastSavedAt ? ` · ${relativeTime(autosave.lastSavedAt)}` : ''}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => downloadText(`${slug}.md`, toMarkdownFile(article))}>
            导出
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowPublish(true)} disabled={readOnly}>
            {article.status === 'published' ? '更新发布' : '发布'}
          </Button>
        </div>
      </div>

      {snapshot ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>检测到未正常保存的编辑内容（{formatDateTime(snapshot.savedAt)}）。</span>
          <Button size="sm" variant="secondary" onClick={handleRestoreSnapshot}>
            恢复快照
          </Button>
          <button type="button" className="text-xs underline" onClick={() => setSnapshot(null)}>
            忽略
          </button>
        </div>
      ) : null}

      {readOnly ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
          <span>这篇文章正在另一个标签页中编辑，当前为只读。</span>
          <Button size="sm" variant="secondary" onClick={lock.takeover}>
            在此标签页接管
          </Button>
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          {notice}
        </p>
      ) : null}

      {job ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">最近发布：{JOB_LABEL[job.status]}</span>
          {job.errorMessage ? <span className="text-red-600">{job.errorMessage}</span> : null}
          {job.checkedAt ? <span>检查于 {relativeTime(job.checkedAt)}</span> : null}
          {job.runUrl ? (
            <a href={job.runUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent)]">
              查看构建日志 ↗
            </a>
          ) : null}
          {job.status === 'failed' ? (
            <button type="button" className="underline" onClick={() => setShowPublish(true)}>
              重试发布
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-col gap-3">
              <Field label="标题" required>
                <Input value={title} onChange={(event) => handleTitleChange(event.target.value)} disabled={readOnly} />
              </Field>
              <Field label="Slug" hint="小写字母、数字与连字符；发布后作为 URL 路径">
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true)
                      setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }}
                    onBlur={() => {
                      if (!slug) setSlug(toSlug(title, 'post'))
                    }}
                    disabled={readOnly}
                    className="font-mono"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSlug(toSlug(title, 'post'))
                      setSlugTouched(true)
                    }}
                    disabled={readOnly}
                  >
                    生成
                  </Button>
                </div>
              </Field>
              <Field label="发布日期" hint="不可晚于当前时间；影响公开站排序">
                <Input
                  type="datetime-local"
                  value={dateLocal}
                  onChange={(event) => setDateLocal(event.target.value)}
                  disabled={readOnly}
                />
              </Field>
              <Field label="标签" hint="用逗号分隔，最多 12 个">
                <Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} disabled={readOnly} />
              </Field>
              <Field label="摘要" hint="用于列表与 RSS，留空则自动截取正文">
                <Textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={3}
                  disabled={readOnly}
                />
              </Field>
              <Field label="封面" hint="将随文章一起发布到仓库">
                <div className="flex items-center gap-3">
                  {coverAssetId && assetUrls.get(coverAssetId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrls.get(coverAssetId)}
                      alt="封面"
                      className="h-16 w-24 rounded border border-[var(--color-border)] object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[var(--color-text-subtle)]">未设置</span>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleCoverFile(file)
                      if (coverInputRef.current) coverInputRef.current.value = ''
                    }}
                  />
                  <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()} disabled={readOnly}>
                    选择图片
                  </Button>
                  {coverAssetId ? (
                    <button type="button" className="text-xs text-[var(--color-danger)]" onClick={() => setCoverAssetId(null)}>
                      移除
                    </button>
                  ) : null}
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)]">写作提示</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>粘贴或拖入图片会自动压缩并保存到本地资源库。</li>
              <li>Ctrl/Cmd + S 立即保存；离开页面会自动保存。</li>
              <li>预览与公开站使用同一套渲染链。</li>
              <li>正文 {Math.round(contentBytes / 1024)} KB，上限 2 MB。</li>
            </ul>
          </div>
        </div>

        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-subtle)]">
            <span>Markdown</span>
            <span className="hidden sm:inline">实时预览（同发布渲染）</span>
          </div>
          <div className="grid min-h-0 flex-1 lg:grid-cols-2">
            <div className="h-[45vh] min-h-0 border-b border-[var(--color-border)] lg:h-auto lg:border-b-0 lg:border-r">
              <CodeEditor
                key={`${article.id}-${readOnly}`}
                initialValue={content}
                onChange={setContent}
                readOnly={readOnly}
                onImageFiles={handleImageFiles}
                onFlushShortcut={() => void autosave.flush()}
              />
            </div>
            <div className="h-[45vh] min-h-0 overflow-y-auto p-5 lg:h-auto">
              <MarkdownPreview content={content} assetUrls={assetUrls} />
            </div>
          </div>
        </div>
      </div>

      {showPublish ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  {article.status === 'published' ? '更新发布' : '发布文章'}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  发布会把 Markdown 与图片提交到 GitHub，并触发 Actions 构建。
                </p>
              </div>
              <button type="button" className="text-sm text-[var(--color-text-subtle)]" onClick={() => setShowPublish(false)}>
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">标题</span>
                <span className="text-right font-medium">{title || '（未填写）'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">路径</span>
                <span className="text-right font-mono">/posts/{slug || '（未填写）'}/</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">图片</span>
                <span className="text-right">{Math.max(0, assetIds.length - (coverAssetId ? 1 : 0))} 张正文图</span>
              </div>
            </div>

            {!canPublish ? (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                请检查：标题不能为空、slug 只能包含小写字母数字与连字符、发布日期不能晚于现在。
              </p>
            ) : null}

            {findings.length > 0 ? (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-medium">发布前提醒（不会阻断发布）</p>
                <ul className="mt-1 list-disc pl-4">
                  {findings.map((finding) => (
                    <li key={`${finding.label}-${finding.sample}`}>
                      {finding.label}：{finding.sample}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {publishError ? (
              <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{publishError}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void handleUnpublish()}
                disabled={publishing || article.status === 'draft'}
                className="text-xs text-[var(--color-danger)] disabled:opacity-40"
              >
                下线这篇文章
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowPublish(false)}>
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handlePublish()}
                  loading={publishing}
                  disabled={!canPublish}
                >
                  {conflictPath ? '覆盖远端并发布' : '确认发布'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
