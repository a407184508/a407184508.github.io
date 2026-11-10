import type { GitHubConnection } from '@blog/core'
import { GitHubError, GitHubHttp } from './http'

export interface GitTreeEntry {
  path: string
  mode: string
  type: string
  sha: string
}

interface RefResponse {
  object: { sha: string }
}

interface CommitResponse {
  sha: string
  tree: { sha: string }
}

interface TreeResponse {
  sha: string
  tree: GitTreeEntry[]
  truncated?: boolean
}

export interface RepoInfo {
  default_branch: string
  permissions?: { push?: boolean; admin?: boolean }
  full_name: string
}

export interface WorkflowRun {
  id: number
  html_url: string
  status: string
  conclusion: string | null
  head_sha: string
  path?: string
}

interface RunsResponse {
  workflow_runs: WorkflowRun[]
}

export interface PublishFile {
  path: string
  /** 文本文件用 utf8 内容；二进制用 bytes */
  content?: string
  bytes?: Uint8Array
  mime?: string
}

export interface VerifyResult {
  ok: boolean
  code?: string
  hasWorkflow?: boolean
  message?: string
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * 轻量 GitHub 客户端：只覆盖发布需要的 Git Data API。
 * 不引入 Octokit，便于 mock 与错误映射。
 */
export class GitHubClient {
  private readonly conn: GitHubConnection
  private readonly http: GitHubHttp

  constructor(connection: GitHubConnection, options: { apiBase?: string; fetchImpl?: typeof fetch } = {}) {
    this.conn = connection
    this.http = new GitHubHttp(connection.token, options)
  }

  private get repoPath(): string {
    return `/repos/${this.conn.owner}/${this.conn.repo}`
  }

  private get branch(): string {
    return this.conn.branch || 'main'
  }

  async getRepo(): Promise<RepoInfo> {
    return this.http.request<RepoInfo>(this.repoPath)
  }

  async verifyConnection(): Promise<VerifyResult> {
    try {
      const repo = await this.getRepo()
      if (repo.permissions && repo.permissions.push === false) {
        return { ok: false, code: 'forbidden', message: 'Token 没有写入权限（Contents: Read and write）' }
      }
      await this.http.request<RefResponse>(`${this.repoPath}/branches/${encodeURIComponent(this.branch)}`)
      let hasWorkflow = false
      try {
        await this.http.request(`${this.repoPath}/contents/.github/workflows/deploy.yml`)
        hasWorkflow = true
      } catch {
        hasWorkflow = false
      }
      return { ok: true, hasWorkflow }
    } catch (error) {
      if (error instanceof GitHubError) return { ok: false, code: error.code, message: error.message }
      return { ok: false, code: 'unknown', message: '连接校验失败' }
    }
  }

  async getHead(): Promise<{ commitSha: string; treeSha: string }> {
    const ref = await this.http.request<RefResponse>(`${this.repoPath}/git/ref/heads/${encodeURIComponent(this.branch)}`)
    const commit = await this.http.request<CommitResponse>(`${this.repoPath}/git/commits/${ref.object.sha}`)
    return { commitSha: commit.sha, treeSha: commit.tree.sha }
  }

  async listTree(treeSha: string): Promise<GitTreeEntry[]> {
    const tree = await this.http.request<TreeResponse>(`${this.repoPath}/git/trees/${treeSha}?recursive=1`)
    return tree.tree
  }

  /** 支撑 10.3 的冲突判定。 */
  async checkRemotePath(
    slug: string,
    options: { ownedByLocal?: boolean } = {},
  ): Promise<{ exists: boolean; path: string; ownedByLocal: boolean }> {
    const path = `content/posts/${slug}.md`
    const { treeSha } = await this.getHead()
    const entries = await this.listTree(treeSha)
    const exists = entries.some((entry) => entry.path === path)
    return { exists, path, ownedByLocal: Boolean(options.ownedByLocal) }
  }

  private async createBlob(file: PublishFile): Promise<string> {
    const body =
      file.bytes !== undefined
        ? { content: toBase64(file.bytes), encoding: 'base64' }
        : { content: file.content ?? '', encoding: 'utf-8' }
    const blob = await this.http.request<{ sha: string }>(`${this.repoPath}/git/blobs`, { method: 'POST', body })
    return blob.sha
  }

  private async commitTree(
    head: { commitSha: string; treeSha: string },
    files: PublishFile[],
    deletions: string[],
    message: string,
  ): Promise<{ commitSha: string }> {
    const tree: Array<{ path: string; mode: string; type: string; sha: string | null }> = []
    for (const file of files) {
      const sha = await this.createBlob(file)
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha })
    }

    if (deletions.length > 0) {
      const entries = await this.listTree(head.treeSha)
      const existing = new Map(entries.map((entry) => [entry.path, entry]))
      for (const path of deletions) {
        if (!existing.has(path)) continue
        tree.push({ path, mode: '100644', type: 'blob', sha: null })
      }
    }

    if (tree.length === 0) throw new GitHubError('commit_failed', '没有需要提交的文件')

    const newTree = await this.http.request<{ sha: string }>(`${this.repoPath}/git/trees`, {
      method: 'POST',
      body: { base_tree: head.treeSha, tree },
    })
    const commit = await this.http.request<{ sha: string }>(`${this.repoPath}/git/commits`, {
      method: 'POST',
      body: { message, tree: newTree.sha, parents: [head.commitSha] },
    })

    try {
      await this.http.request(`${this.repoPath}/git/refs/heads/${encodeURIComponent(this.branch)}`, {
        method: 'PATCH',
        body: { sha: commit.sha, force: false },
      })
    } catch (error) {
      if (error instanceof GitHubError && error.status === 422) {
        // 并发更新：读取最新 head 重试一次
        await this.http.request(`${this.repoPath}/git/refs/heads/${encodeURIComponent(this.branch)}`, {
          method: 'PATCH',
          body: { sha: commit.sha, force: false },
        })
      } else {
        throw error
      }
    }

    return { commitSha: commit.sha }
  }

  async publish(input: {
    slug: string
    markdown: string
    images: PublishFile[]
    /** 同一次提交内删除的旧路径（slug 变更时清理） */
    deletions?: string[]
    message?: string
  }): Promise<{ commitSha: string }> {
    const head = await this.getHead()
    const files: PublishFile[] = [
      ...input.images,
      { path: `content/posts/${input.slug}.md`, content: input.markdown },
    ]
    return this.commitTree(head, files, input.deletions ?? [], input.message ?? `post: ${input.slug}`)
  }

  /** 删除指定目录下的全部远端文件（用于 slug 变更清理）。 */
  async listPathsUnder(prefix: string): Promise<string[]> {
    const { treeSha } = await this.getHead()
    const entries = await this.listTree(treeSha)
    return entries.filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix)).map((entry) => entry.path)
  }

  /** 下线：删除文章与整个图片目录，触发重新构建。 */
  async unpublish(slug: string): Promise<{ commitSha: string }> {
    const head = await this.getHead()
    const entries = await this.listTree(head.treeSha)
    const articlePath = `content/posts/${slug}.md`
    const imagePrefix = `apps/web/public/images/posts/${slug}/`
    const deletions = entries
      .filter((entry) => entry.type === 'blob' && (entry.path === articlePath || entry.path.startsWith(imagePrefix)))
      .map((entry) => entry.path)
    if (!deletions.includes(articlePath)) {
      throw new GitHubError('commit_failed', `远端不存在 content/posts/${slug}.md`)
    }
    return this.commitTree(head, [], deletions, `unpublish: ${slug}`)
  }

  async findRun(commitSha: string): Promise<{ runId: number; runUrl: string; status: string } | null> {
    const runs = await this.http.request<RunsResponse>(
      `${this.repoPath}/actions/runs?head_sha=${commitSha}&branch=${encodeURIComponent(this.branch)}&per_page=10`,
    )
    const deploy = runs.workflow_runs.find((run) => (run.path ?? '').endsWith('deploy.yml')) ?? runs.workflow_runs[0]
    if (!deploy) return null
    return { runId: deploy.id, runUrl: deploy.html_url, status: deploy.conclusion ?? deploy.status }
  }

  async getRun(runId: number): Promise<{ status: string; conclusion: string | null; url: string }> {
    const run = await this.http.request<WorkflowRun>(`${this.repoPath}/actions/runs/${runId}`)
    return { status: run.status, conclusion: run.conclusion, url: run.html_url }
  }
}
