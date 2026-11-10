import type { PublishErrorCode } from '@blog/core'

export class GitHubError extends Error {
  readonly code: PublishErrorCode
  readonly status: number

  constructor(code: PublishErrorCode, message: string, status = 0) {
    super(message)
    this.name = 'GitHubError'
    this.code = code
    this.status = status
  }
}

export interface GitHubRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token: string
}

function mapStatus(status: number): PublishErrorCode {
  if (status === 401) return 'token_invalid'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'repo_not_found'
  if (status === 409 || status === 422) return 'conflict'
  return 'unknown'
}

const STATUS_MESSAGE: Record<number, string> = {
  401: 'Token 无效或已过期',
  403: 'Token 没有足够权限',
  404: '仓库、分支或文件不存在',
  409: '远端已更新，请重试',
  422: '提交冲突，请重试',
}

export class GitHubHttp {
  private readonly apiBase: string
  private readonly token: string
  private readonly fetchImpl: typeof fetch

  constructor(token: string, options: { apiBase?: string; fetchImpl?: typeof fetch } = {}) {
    this.token = token
    this.apiBase = options.apiBase ?? 'https://api.github.com'
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async request<T>(path: string, options: Omit<GitHubRequestOptions, 'token'> = {}): Promise<T> {
    const { method = 'GET', body } = options
    let response: Response
    try {
      response = await this.fetchImpl(`${this.apiBase}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    } catch {
      throw new GitHubError('network', '网络请求失败，请检查网络后重试')
    }

    if (!response.ok) {
      const code = mapStatus(response.status)
      let detail = STATUS_MESSAGE[response.status] ?? `GitHub 返回 ${response.status}`
      try {
        const payload = (await response.json()) as { message?: string }
        if (payload.message) detail = `${detail}：${payload.message}`
      } catch {
        /* 忽略非 JSON 错误体 */
      }
      throw new GitHubError(code, detail, response.status)
    }

    if (response.status === 204) return undefined as T
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) return (await response.text()) as T
    return (await response.json()) as T
  }
}
