'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { extractAssetIds, type Article } from '@blog/core'
import { Button, Card, Field } from '@blog/ui'
import { listArticles } from '@/lib/articles'
import { useAssetUrls } from '@/lib/assets'
import { WECHAT_THEMES, renderWechatHtml } from '@blog/markdown'

export default function WechatToolPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [content, setContent] = useState('')
  const [themeId, setThemeId] = useState('default')
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    void listArticles().then(setArticles)
  }, [])

  const assetIds = useMemo(() => extractAssetIds(content), [content])
  const assetUrls = useAssetUrls(assetIds)
  const assetKey = [...assetUrls.keys()].sort().join(',')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const result = await renderWechatHtml(content, {
            themeId,
            resolveAssetUrl: (id) => assetUrls.get(id) ?? null,
          })
          if (!cancelled) {
            setHtml(result)
            setError(null)
          }
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : '渲染失败')
        }
      })()
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, themeId, assetKey])

  async function handleCopy() {
    try {
      const container = document.createElement('div')
      container.innerHTML = html
      const plain = container.textContent ?? ''
      const items: Record<string, Blob> = {
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem(items)])
      } else {
        await navigator.clipboard.writeText(plain)
      }
      setCopied('已复制富文本，可直接粘贴到公众号编辑器。')
    } catch {
      setCopied('复制失败，请检查浏览器剪贴板权限。')
    }
  }

  function handleDownload() {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'wechat-article.html'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">公众号排版</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            生成全内联样式的富文本，复制后直接粘贴到公众号编辑器。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownload} disabled={!content}>
            下载 HTML
          </Button>
          <Button variant="primary" onClick={() => void handleCopy()} disabled={!content}>
            复制富文本
          </Button>
        </div>
      </div>

      {copied ? (
        <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          {copied}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="从已保存文章导入">
              <select
                className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                defaultValue=""
                onChange={(event) => {
                  const article = articles.find((item) => item.id === event.target.value)
                  if (article) setContent(article.content)
                  event.target.value = ''
                }}
              >
                <option value="">选择文章…</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="主题">
              <select
                value={themeId}
                onChange={(event) => setThemeId(event.target.value)}
                className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                {WECHAT_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <textarea
            ref={editorRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="在这里粘贴 Markdown 内容，或从上方选择一篇文章…"
            className="min-h-[55vh] w-full resize-y rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-sm leading-relaxed focus:border-[var(--color-accent)] focus:outline-none"
          />

          <p className="text-xs text-[var(--color-text-subtle)]">
            本地图片使用浏览器临时地址，复制后在公众号中可能无法显示；建议先发布文章，再用公开地址替换。
            {content ? ` 当前正文包含 ${assetIds.length} 张本地图片。` : ''}
          </p>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-text-subtle)]">手机宽度预览（375px）</p>
          <div className="mx-auto w-full max-w-[375px] overflow-y-auto rounded-[18px] border border-[var(--color-border)] bg-white p-4 shadow-sm" style={{ maxHeight: '78vh' }}>
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="py-10 text-center text-sm text-[var(--color-text-subtle)]">预览会显示在这里</p>
            )}
          </div>
          <Link href="/app/" className="text-center text-xs text-[var(--color-text-subtle)]">
            ← 返回概览
          </Link>
        </div>
      </div>
    </div>
  )
}
