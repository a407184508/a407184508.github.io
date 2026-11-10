import { GitHubConnectionSchema, nowIso, type GitHubConnection } from '@blog/core'
import { GitHubClient } from '@blog/publish'
import { SETTING_KEYS, deleteSetting, getSetting, setSetting } from './settings'

export async function getGithubConnection(): Promise<GitHubConnection | null> {
  const value = await getSetting<unknown>(SETTING_KEYS.githubConnection)
  if (!value) return null
  const parsed = GitHubConnectionSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export interface ConnectInput {
  owner: string
  repo: string
  branch: string
  token: string
}

export interface ConnectResult {
  ok: boolean
  code?: string
  message?: string
  hasWorkflow?: boolean
}

/** 校验通过后才落库；Token 仅保存在 IndexedDB。 */
export async function connectGithub(input: ConnectInput): Promise<ConnectResult> {
  const now = nowIso()
  const connection: GitHubConnection = {
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    branch: input.branch.trim() || 'main',
    token: input.token.trim(),
    connectedAt: now,
    lastVerifiedAt: now,
  }
  const client = new GitHubClient(connection)
  const result = await client.verifyConnection()
  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message }
  }
  await setSetting(SETTING_KEYS.githubConnection, { ...connection, lastVerifiedAt: now })
  return { ok: true, hasWorkflow: result.hasWorkflow }
}

export async function clearGithubConnection(): Promise<void> {
  await deleteSetting(SETTING_KEYS.githubConnection)
}

export async function getGithubClient(): Promise<GitHubClient | null> {
  const connection = await getGithubConnection()
  if (!connection) return null
  return new GitHubClient(connection)
}

/** 设置页展示用：只显示 Token 后 4 位。 */
export function maskToken(token: string): string {
  if (token.length <= 4) return '****'
  return `••••••••${token.slice(-4)}`
}
