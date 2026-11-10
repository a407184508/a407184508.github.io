'use client'

import { useEffect, useState } from 'react'

export interface MarkdownPreviewProps {
  content: string
  assetUrls: Map<string, string>
  className?: string
}

/** 浏览器端预览：与公开站共用同一套渲染链，Shiki 懒加载。 */
export function MarkdownPreview({ content, assetUrls, className }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const assetKey = [...assetUrls.keys()].sort().join(',')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const { renderMarkdown } = await import('@blog/markdown')
          const result = await renderMarkdown(content, {
            resolveAssetUrl: (id) => assetUrls.get(id) ?? null,
          })
          if (!cancelled) {
            setHtml(result.html)
            setError(null)
          }
        } catch (cause) {
          if (!cancelled) setError(cause instanceof Error ? cause.message : '预览渲染失败')
        }
      })()
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, assetKey])

  if (error) {
    return <p className="rounded-[var(--radius)] bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
  }

  return <div className={`prose ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}
