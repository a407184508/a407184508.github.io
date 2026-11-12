'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { extractAssetIds, type Article } from '@blog/core'
import { CARD_THEMES, getCardTheme, exceedsCanvasLimit, paginateBlocks, type BlockKind, type BlockMetric } from '@blog/markdown'
import { Button, Card, Field, Input } from '@blog/ui'
import { listArticles } from '@/lib/articles'
import { useAssetUrls } from '@/lib/assets'

const SIZE_PRESETS = [
  { id: '1080x1440', label: '1080 × 1440（小红书 3:4）', width: 1080, height: 1440 },
  { id: '1080x1920', label: '1080 × 1920（竖屏 9:16）', width: 1080, height: 1920 },
  { id: '1242x1660', label: '1242 × 1660（小红书封面）', width: 1242, height: 1660 },
  { id: '900x1200', label: '900 × 1200（方图 3:4）', width: 900, height: 1200 },
] as const

const OUTER_PADDING = 32
const FOOTER = 40
const CANVAS_LIMIT = 16384

type Mode = 'single' | 'paged'

function kindOf(element: HTMLElement): BlockKind {
  const tag = element.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) return 'heading'
  if (tag === 'pre') return 'code'
  if (tag === 'img' || tag === 'figure') return 'image'
  if (tag === 'table') return 'table'
  if (element.firstElementChild?.tagName.toLowerCase() === 'table') return 'table'
  return 'text'
}

interface Layout {
  metrics: BlockMetric[]
  nodes: HTMLElement[]
  totalHeight: number
}

/** 读取顶层块的高度：用相邻块顶部差值计算，天然包含外边距。 */
function collectBlocks(measure: HTMLElement): Layout {
  const measureRect = measure.getBoundingClientRect()
  const nodes: HTMLElement[] = []
  const title = measure.querySelector<HTMLElement>('[data-role="title"]')
  if (title) nodes.push(title)
  const body = measure.querySelector<HTMLElement>('[data-role="body"]')
  if (body) {
    for (const child of Array.from(body.children)) nodes.push(child as HTMLElement)
  }

  const metrics = nodes.map((node, index) => {
    const top = node.getBoundingClientRect().top - measureRect.top
    const next = nodes[index + 1]
    const height = next
      ? next.getBoundingClientRect().top - measureRect.top - top
      : measureRect.height - top
    const kind = kindOf(node)
    return { height: Math.max(1, Math.round(height)), kind, keepWithNext: kind === 'heading' }
  })

  return { metrics, nodes, totalHeight: Math.round(measureRect.height) }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }
      try {
        await image.decode()
      } catch {
        // 解码失败交给导出阶段报错
      }
    }),
  )
}

function createPageNode(
  nodes: HTMLElement[],
  size: { width: number; height: number },
  themeId: string,
  title: string,
  pager: { index: number; total: number } | null,
): HTMLElement {
  const theme = getCardTheme(themeId)
  // 离屏容器负责定位，截图节点本身保持 static，否则克隆后内容会被画到画布外
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;top:0;left:-20000px;pointer-events:none;'
  const page = document.createElement('div')
  page.style.cssText = [
    `width:${size.width}px`,
    `height:${size.height}px`,
    `padding:${OUTER_PADDING}px`,
    'box-sizing:border-box',
    `background:${theme.background}`,
    'display:flex',
    'flex-direction:column',
  ].join(';')

  const card = document.createElement('div')
  card.style.cssText = [
    'flex:1 1 auto',
    'min-height:0',
    'display:flex',
    'flex-direction:column',
    `padding:${theme.padding}`,
    `background:${theme.cardBg}`,
    theme.rounded ? 'border-radius:20px' : '',
    'box-shadow:0 8px 40px rgba(0,0,0,0.08)',
    'overflow:hidden',
  ].join(';')

  if (title) {
    const titleEl = document.createElement('div')
    titleEl.style.cssText = [
      'font-size:34px',
      'font-weight:800',
      `color:${theme.color}`,
      'line-height:1.3',
      'margin:0 0 24px',
      'letter-spacing:0.01em',
    ].join(';')
    titleEl.textContent = title
    card.appendChild(titleEl)
  }

  const body = document.createElement('div')
  body.style.cssText = 'flex:1 1 auto;min-height:0;'
  for (const node of nodes) body.appendChild(node.cloneNode(true))
  card.appendChild(body)

  page.appendChild(card)

  if (pager) {
    const footer = document.createElement('div')
    footer.style.cssText = `flex:0 0 ${FOOTER}px;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:0.12em;color:${theme.muted};`
    footer.textContent = `${pager.index} / ${pager.total}`
    page.appendChild(footer)
  }

  holder.appendChild(page)
  document.body.appendChild(holder)
  return page
}

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export default function LongImageToolPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [themeId, setThemeId] = useState<string>('xhs-purple')
  const [presetId, setPresetId] = useState<string>('1080x1440')
  const [scale, setScale] = useState(2)
  const [mode, setMode] = useState<Mode>('paged')
  const [showPager, setShowPager] = useState(true)
  const [html, setHtml] = useState('')
  const [stats, setStats] = useState<{ pageCount: number; totalHeight: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  const theme = getCardTheme(themeId)
  const preset = SIZE_PRESETS.find((item) => item.id === presetId) ?? SIZE_PRESETS[0]
  // 内容区宽度 = 页宽 - 外层 padding - 卡片 padding 左右
  const cardPaddingX = (() => {
    const m = theme.padding.match(/(\d+)px/)
    return m ? Number(m[1]) : 40
  })()
  const contentWidth = preset.width - OUTER_PADDING * 2 - cardPaddingX * 2

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
          const { renderCardHtml } = await import('@blog/markdown')
          const result = await renderCardHtml(content, {
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
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, themeId, assetKey])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        const measure = measureRef.current
        if (!measure) return
        await document.fonts.ready
        await waitForImages(measure)
        if (cancelled) return
        const layout = collectBlocks(measure)
        const pageHeight = preset.height - OUTER_PADDING * 2 - (showPager ? FOOTER : 0) - 2
        const pages = paginateBlocks(layout.metrics, { pageHeight })
        setStats({ pageCount: pages.length, totalHeight: layout.totalHeight })
      })()
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [html, title, preset, themeId, showPager])

  async function handleExport() {
    const measure = measureRef.current
    if (!measure || !content) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await document.fonts.ready
      await waitForImages(measure)
      const { metrics, nodes, totalHeight } = collectBlocks(measure)
      if (nodes.length === 0) throw new Error('没有可导出的内容')

      const { toPng } = await import('html-to-image')
      const footerHeight = showPager ? FOOTER : 0
      const singleHeight = totalHeight + OUTER_PADDING * 2

      let usePaged = mode === 'paged'
      if (!usePaged && exceedsCanvasLimit(singleHeight, scale, CANVAS_LIMIT)) {
        usePaged = true
        setNotice('内容高度超过浏览器画布上限，已自动切换为分页导出。')
      }

      const date = new Date().toISOString().slice(0, 10)
      const baseName = `${date}-${(title || 'long-image').replace(/[\\/:*?"<>|\s]+/g, '-')}-${preset.width}x${preset.height}`
      const pageHeight = preset.height - OUTER_PADDING * 2 - footerHeight - 2

      if (!usePaged) {
        const page = createPageNode(nodes, { width: preset.width, height: singleHeight }, themeId, title, null)
        try {
          const dataUrl = await toPng(page, {
            pixelRatio: scale,
            cacheBust: true,
            width: preset.width,
            height: singleHeight,
          })
          downloadBlob(new Blob([dataUrlToBytes(dataUrl)], { type: 'image/png' }), `${baseName}.png`)
        } finally {
          page.parentElement?.remove()
        }
        setNotice(`已导出单张长图（${preset.width} × ${singleHeight}，${scale}x）。`)
        return
      }

      const pages = paginateBlocks(metrics, { pageHeight })
      const files: { name: string; dataUrl: string }[] = []
      const failures: number[] = []

      for (let index = 0; index < pages.length; index += 1) {
        const slice = pages[index]!
        const pageNodes = slice.indexes.map((blockIndex) => nodes[blockIndex]!).filter(Boolean)
        const page = createPageNode(pageNodes, { width: preset.width, height: preset.height }, themeId, title, {
          index: index + 1,
          total: pages.length,
        })
        try {
          const dataUrl = await toPng(page, {
            pixelRatio: scale,
            cacheBust: true,
            width: preset.width,
            height: preset.height,
          })
          files.push({ name: `${baseName}-${String(index + 1).padStart(2, '0')}.png`, dataUrl })
        } catch {
          failures.push(index + 1)
        } finally {
          page.parentElement?.remove()
        }
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      }

      if (files.length === 0) throw new Error('所有页面导出失败，请减少内容后重试')

      if (files.length === 1) {
        downloadBlob(new Blob([dataUrlToBytes(files[0]!.dataUrl)], { type: 'image/png' }), files[0]!.name)
      } else {
        const { zipSync } = await import('fflate')
        const entries: Record<string, Uint8Array> = {}
        for (const file of files) entries[file.name] = dataUrlToBytes(file.dataUrl)
        downloadBlob(new Blob([zipSync(entries)], { type: 'application/zip' }), `${baseName}.zip`)
      }

      if (failures.length > 0) {
        setError(`第 ${failures.join('、')} 页导出失败，其余页面已下载。可减少该页内容后重试。`)
      } else {
        setNotice(`已导出 ${files.length} 页（${preset.width} × ${preset.height}，${scale}x）。`)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">长图导出</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Markdown 一键生成小红书风格知识卡片，自动分页，标题不会单独留在页尾。
          </p>
        </div>
        <Button variant="primary" onClick={() => void handleExport()} loading={busy} disabled={!content}>
          导出{stats && stats.pageCount > 1 ? ' ZIP' : ' PNG'}
        </Button>
      </div>

      {error ? (
        <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-3">
          <Field label="从已保存文章导入">
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              defaultValue=""
              onChange={(event) => {
                const article = articles.find((item) => item.id === event.target.value)
                if (article) {
                  setContent(article.content)
                  setTitle(article.title)
                }
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

          <Field label="卡片主题">
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              value={themeId}
              onChange={(event) => setThemeId(event.target.value)}
            >
              {CARD_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="图片标题">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="留空则不显示标题" />
          </Field>

          <Field label="尺寸">
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
            >
              {SIZE_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="模式">
              <select
                className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                value={mode}
                onChange={(event) => setMode(event.target.value as Mode)}
              >
                <option value="paged">按尺寸分页</option>
                <option value="single">整张长图</option>
              </select>
            </Field>
            <Field label="像素倍率">
              <select
                className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <input type="checkbox" checked={showPager} onChange={(event) => setShowPager(event.target.checked)} />
            显示页码
          </label>

          <Field label="Markdown 内容">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="粘贴 Markdown…"
              className="min-h-[28vh] w-full resize-y rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 font-mono text-sm leading-relaxed focus:border-[var(--color-accent)] focus:outline-none"
            />
          </Field>

          <p className="text-xs text-[var(--color-text-subtle)]">
            {stats
              ? `内容高 ${stats.totalHeight}px · 预计 ${stats.pageCount} 页（${preset.width} × ${preset.height}，${scale}x）`
              : '输入内容后显示分页预估。'}
          </p>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-text-subtle)]">预览（{preset.width}px 实际宽度，可横向滚动）</p>
          <div className="overflow-auto rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <div
              style={{
                width: preset.width,
                margin: '0 auto',
                background: theme.background,
                padding: `${OUTER_PADDING}px`,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  background: theme.cardBg,
                  padding: theme.padding,
                  borderRadius: theme.rounded ? 20 : 0,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                  color: theme.color,
                }}
              >
                {title ? (
                  <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.3, margin: '0 0 24px', color: theme.color }}>
                    {title}
                  </div>
                ) : null}
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 离屏测量容器：与导出卡片同宽、同 padding、同字体，保证块高一致 */}
      <div
        aria-hidden
        ref={measureRef}
        style={{
          position: 'fixed',
          top: 0,
          left: -20000,
          width: contentWidth,
          background: theme.cardBg,
          padding: theme.padding,
          color: theme.color,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSize,
          lineHeight: theme.lineHeight,
          pointerEvents: 'none',
        }}
      >
        {title ? (
          <div
            data-role="title"
            style={{
              fontSize: 34,
              fontWeight: 800,
              lineHeight: 1.3,
              margin: '0 0 24px',
              color: theme.color,
            }}
          >
            {title}
          </div>
        ) : null}
        <div data-role="body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
