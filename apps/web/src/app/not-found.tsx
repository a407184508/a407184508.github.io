import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-[var(--color-accent)]">404</p>
      <h1 className="text-lg font-semibold">页面不存在</h1>
      <p className="text-sm text-[var(--color-text-muted)]">链接可能已失效，或者文章还没有发布。</p>
      <div className="flex gap-3 text-sm">
        <Link href="/" className="text-[var(--color-accent)] hover:underline">
          返回首页
        </Link>
        <Link href="/archive/" className="text-[var(--color-text-muted)] hover:underline">
          查看归档
        </Link>
      </div>
    </div>
  )
}
