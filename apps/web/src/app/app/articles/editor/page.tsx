'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Article } from '@blog/core'
import { Button, Empty } from '@blog/ui'
import { createArticle, getArticle } from '@/lib/articles'
import { EditorWorkspace } from '@/features/articles/EditorWorkspace'

function EditorLoader() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [notFound, setNotFound] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      const found = await getArticle(id)
      if (cancelled) return
      setArticle(found)
      setNotFound(!found)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleCreate() {
    setCreating(true)
    try {
      const created = await createArticle()
      router.replace(`/app/articles/editor/?id=${created.id}`)
      setArticle(created)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">正在打开编辑器…</p>
  }

  if (!id || notFound) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Empty
          title={notFound ? '文章不存在或已被删除' : '还没有选择文章'}
          description={notFound ? '可能已在其他标签页删除。' : '新建一篇文章开始写作。'}
          action={
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleCreate} loading={creating}>
                新建文章
              </Button>
              <Link
                href="/app/articles/"
                className="inline-flex h-10 items-center rounded-[var(--radius)] border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-muted)]"
              >
                返回列表
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  if (!article) return null
  return <EditorWorkspace key={article.id} article={article} />
}

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-[var(--color-text-muted)]">正在加载编辑器…</p>}>
      <EditorLoader />
    </Suspense>
  )
}
