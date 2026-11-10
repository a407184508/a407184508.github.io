'use client'

import { useEffect, useRef, useState } from 'react'
import { formatDateTime, relativeTime, type GitHubConnection } from '@blog/core'
import { Badge, Button, Card, Field, Input } from '@blog/ui'
import { clearGithubConnection, connectGithub, getGithubConnection, maskToken } from '@/lib/github'
import { downloadBlob, exportBackup, getLastBackupAt, importBackup, type ImportSummary } from '@/lib/backup'
import { listErrorLogs } from '@/lib/errors'
import type { ErrorLogRow } from '@/lib/db'

export default function SettingsPage() {
  const [connection, setConnection] = useState<GitHubConnection | null>(null)
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [logs, setLogs] = useState<ErrorLogRow[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      const existing = await getGithubConnection()
      setConnection(existing)
      if (existing) {
        setOwner(existing.owner)
        setRepo(existing.repo)
        setBranch(existing.branch)
      }
      setLastBackup(await getLastBackupAt())
      setLogs(await listErrorLogs(20))
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        setUsage({ used: estimate.usage ?? 0, quota: estimate.quota ?? 0 })
      }
    })()
  }, [])

  async function handleConnect() {
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const result = await connectGithub({ owner, repo, branch, token })
      if (!result.ok) {
        setError(result.message ?? '连接失败，请检查仓库与 Token 权限')
      } else {
        setConnection(await getGithubConnection())
        setToken('')
        setMessage(
          result.hasWorkflow
            ? '连接成功，已找到 deploy.yml 工作流。'
            : '连接成功，但仓库缺少 .github/workflows/deploy.yml，发布后不会自动构建。',
        )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '连接失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('断开后需要重新填写 Token 才能发布，本地文章不受影响。')) return
    await clearGithubConnection()
    setConnection(null)
    setToken('')
    setMessage('已断开 GitHub 连接。')
  }

  async function handleExport() {
    setBusy(true)
    setError(null)
    try {
      const blob = await exportBackup()
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(`blog-studio-backup-${stamp}.zip`, blob)
      setLastBackup(await getLastBackupAt())
      setMessage('备份已导出。备份只包含业务数据，不包含 GitHub Token。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    setBusy(true)
    setError(null)
    setImportSummary(null)
    try {
      const summary = await importBackup(file)
      setImportSummary(summary)
      setMessage('导入完成，刷新页面即可看到最新数据。')
      setLogs(await listErrorLogs(20))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导入失败')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const usedMb = usage ? (usage.used / 1024 / 1024).toFixed(1) : '—'
  const quotaMb = usage ? Math.round(usage.quota / 1024 / 1024) : '—'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">连接 GitHub、管理本地数据与备份。</p>
      </div>

      {message ? (
        <p className="rounded-[var(--radius)] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">GitHub 连接</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              需要 Fine-grained PAT：Contents 读写、Actions 读取、Metadata 读取。Token 只保存在本浏览器。
            </p>
          </div>
          {connection ? <Badge tone="success">已连接</Badge> : <Badge tone="neutral">未连接</Badge>}
        </div>

        {connection ? (
          <div className="flex flex-col gap-2 rounded-[var(--radius)] bg-[var(--color-surface-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
            <p>
              仓库：<span className="font-mono text-[var(--color-text)]">{connection.owner}/{connection.repo}</span> · 分支{' '}
              <span className="font-mono">{connection.branch}</span>
            </p>
            <p>
              Token：<span className="font-mono">{maskToken(connection.token)}</span> · 上次校验{' '}
              {relativeTime(connection.lastVerifiedAt)}
            </p>
            <div className="flex gap-3 pt-1">
              <button type="button" className="text-[var(--color-danger)]" onClick={() => void handleDisconnect()}>
                断开连接
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="用户名 / 组织" required>
            <Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="yourname" />
          </Field>
          <Field label="仓库名" required hint="例如 yourname.github.io">
            <Input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="yourname.github.io" />
          </Field>
          <Field label="分支" required>
            <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
          </Field>
          <Field label="Fine-grained Token" required hint="不会显示，也不会进入备份">
            <Input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="github_pat_..."
              autoComplete="off"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={() => void handleConnect()} loading={busy} disabled={!owner || !repo || !token}>
            {connection ? '重新校验并保存' : '校验并连接'}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">数据与备份</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            已用 {usedMb} MB / 配额 {quotaMb} MB
            {lastBackup ? ` · 上次备份 ${formatDateTime(lastBackup)}` : ' · 尚未备份'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => void handleExport()} loading={busy}>
            导出完整备份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImport(file)
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            导入备份包
          </Button>
        </div>

        <p className="text-xs text-[var(--color-text-subtle)]">
          备份包含文章、发布记录、附件与常规设置；不包含 GitHub Token。恢复后需要重新填写 Token 才能发布。
        </p>

        {importSummary ? (
          <div className="rounded-[var(--radius)] bg-[var(--color-surface-muted)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
            新增文章 {importSummary.articlesAdded} · 更新 {importSummary.articlesUpdated} · 跳过{' '}
            {importSummary.articlesSkipped} · 图片 {importSummary.assetsAdded} · 设置 {importSummary.settingsRestored}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">本地错误日志</h2>
          <button
            type="button"
            className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
            onClick={() => void listErrorLogs(20).then(setLogs)}
          >
            刷新
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-[var(--color-text-subtle)]">暂无记录。</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto text-xs">
            {logs.map((log) => (
              <li key={log.id} className="rounded bg-[var(--color-surface-muted)] px-3 py-2">
                <span className="text-[var(--color-text-subtle)]">{formatDateTime(log.at)}</span>{' '}
                <span className="font-mono text-[var(--color-text-muted)]">[{log.scope}]</span> {log.message}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
