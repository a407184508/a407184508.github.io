import type { Article, PublishJob } from '@blog/core'
import { extractAssetIds, nowIso, sha256Hex, shortHash } from '@blog/core'
import { fingerprintArticle } from '@blog/publish'
import { toMarkdownFile } from '@/lib/articles'
import { compressImage, getAsset } from '@/lib/assets'
import { getDb } from '@/lib/db'
import { logError } from '@/lib/errors'
import { getGithubClient } from '@/lib/github'

export class PublishConflictError extends Error {
  readonly remotePath: string
  constructor(remotePath: string) {
    super(`远端已存在 ${remotePath}`)
    this.name = 'PublishConflictError'
    this.remotePath = remotePath
  }
}

interface PreparedImage {
  path: string
  bytes: Uint8Array
  mime: string
  hash: string
}

interface PreparedContent {
  markdown: string
  images: PreparedImage[]
  coverPath: string | null
  imageHashes: string[]
  pathById: Map<string, string>
}

function imageDir(slug: string): string {
  return `apps/web/public/images/posts/${slug}/`
}

function publicImageDir(slug: string): string {
  return `/images/posts/${slug}/`
}

async function prepareContent(article: Article): Promise<PreparedContent> {
  const ids = new Set(extractAssetIds(article.content))
  if (article.coverAssetId) ids.add(article.coverAssetId)

  const images: PreparedImage[] = []
  const pathById = new Map<string, string>()
  let coverPath: string | null = null

  for (const id of ids) {
    const asset = await getAsset(id)
    if (!asset) continue
    const compressed = await compressImage(asset.blob)
    const bytes = new Uint8Array(await compressed.blob.arrayBuffer())
    const hash = shortHash(await sha256Hex(bytes), 8)
    const filename = `${hash}.${compressed.ext}`
    const path = `${imageDir(article.slug)}${filename}`
    images.push({ path, bytes, mime: compressed.mime, hash })
    pathById.set(id, `${publicImageDir(article.slug)}${filename}`)
    if (article.coverAssetId === id) coverPath = pathById.get(id) ?? null
  }

  const markdownContent = article.content.replace(/asset:([a-zA-Z0-9]+)/g, (full, id: string) => {
    return pathById.get(id) ?? full
  })

  return {
    markdown: toMarkdownFile(article, coverPath, markdownContent),
    images,
    coverPath,
    imageHashes: images.map((image) => image.hash),
    pathById,
  }
}

function updateArticle(id: string, patch: Partial<Article>): Promise<string> {
  const db = getDb()
  return db.articles.update(id, patch) as unknown as Promise<string>
}

export interface PublishOptions {
  overwriteRemote?: boolean
}

/** 提交发布任务；返回时已提交到仓库，构建状态由 refreshPublishJob 轮询。 */
export async function publishArticle(articleId: string, options: PublishOptions = {}): Promise<PublishJob> {
  const db = getDb()
  const article = await db.articles.get(articleId)
  if (!article) throw new Error('文章不存在')
  const client = await getGithubClient()
  if (!client) throw new Error('尚未连接 GitHub，请先在设置页填写 Token')

  const now = nowIso()
  const job: PublishJob = {
    id: crypto.randomUUID(),
    articleId: article.id,
    articleSlug: article.slug,
    status: 'queued',
    stage: 'prepare',
    commitSha: null,
    runId: null,
    runUrl: null,
    errorCode: null,
    errorMessage: null,
    fingerprint: null,
    checkedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.publishJobs.put(job)
  await updateArticle(article.id, { status: 'publishing' })

  try {
    const prepared = await prepareContent(article)
    const ownedByLocal = article.remotePath === `content/posts/${article.slug}.md`
    const remote = await client.checkRemotePath(article.slug, { ownedByLocal })
    if (remote.exists && !ownedByLocal && !options.overwriteRemote) {
      throw new PublishConflictError(remote.path)
    }

    const deletions: string[] = []
    if (article.remotePath && article.remotePath !== `content/posts/${article.slug}.md`) {
      const oldSlug = article.remotePath.replace(/^content\/posts\//, '').replace(/\.md$/, '')
      deletions.push(article.remotePath, ...(await client.listPathsUnder(imageDir(oldSlug))))
    }

    job.stage = 'upload'
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)

    const fingerprint = await fingerprintArticle({ markdown: prepared.markdown, imageHashes: prepared.imageHashes })

    job.stage = 'commit'
    await db.publishJobs.put(job)

    const { commitSha } = await client.publish({
      slug: article.slug,
      markdown: prepared.markdown,
      images: prepared.images,
      deletions,
    })

    job.commitSha = commitSha
    job.stage = 'build'
    job.status = 'building'
    job.fingerprint = fingerprint
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)

    return job
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布失败'
    job.status = 'failed'
    job.errorCode = error instanceof PublishConflictError ? 'conflict' : 'commit_failed'
    job.errorMessage = message
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)
    await updateArticle(article.id, { status: 'publish_failed' })
    await logError('publish', error)
    throw error
  }
}

/** 轮询一次构建状态；页面可见时由 UI 定时调用。 */
export async function refreshPublishJob(jobId: string): Promise<PublishJob | null> {
  const db = getDb()
  const job = await db.publishJobs.get(jobId)
  if (!job) return null
  if (job.status === 'success' || job.status === 'failed') return job
  if (!job.commitSha) return job

  const client = await getGithubClient()
  if (!client) return job

  try {
    let runId = job.runId
    if (!runId) {
      const run = await client.findRun(job.commitSha)
      if (run) {
        runId = run.runId
        job.runId = run.runId
        job.runUrl = run.runUrl
      }
    }

    if (runId) {
      const run = await client.getRun(runId)
      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          job.status = 'success'
          job.updatedAt = nowIso()
          await db.publishJobs.put(job)
          const article = await db.articles.get(job.articleId)
          if (article) {
            await db.articles.put({
              ...article,
              status: 'published',
              publishedAt: nowIso(),
              remotePath: `content/posts/${article.slug}.md`,
              lastPublishedHash: job.fingerprint,
              hasUnpublishedChanges: article.updatedAt > job.createdAt,
              updatedAt: nowIso(),
            })
          }
          return job
        }
        job.status = 'failed'
        job.errorCode = 'build_failed'
        job.errorMessage = `构建失败（${run.conclusion ?? 'unknown'}）`
        job.updatedAt = nowIso()
        await db.publishJobs.put(job)
        await updateArticle(job.articleId, { status: 'publish_failed' })
        return job
      }
    }

    job.status = 'building'
    job.checkedAt = nowIso()
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)
    return job
  } catch (error) {
    await logError('publish.poll', error)
    job.checkedAt = nowIso()
    await db.publishJobs.put(job)
    return job
  }
}

export async function getLatestJob(articleId: string): Promise<PublishJob | null> {
  const db = getDb()
  const jobs = await db.publishJobs.where('articleId').equals(articleId).toArray()
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return jobs[0] ?? null
}

/** 下线：删除远端文章与图片目录，本地回到草稿。 */
export async function unpublishArticle(articleId: string): Promise<void> {
  const db = getDb()
  const article = await db.articles.get(articleId)
  if (!article) throw new Error('文章不存在')
  const client = await getGithubClient()
  if (!client) throw new Error('尚未连接 GitHub')

  const now = nowIso()
  const job: PublishJob = {
    id: crypto.randomUUID(),
    articleId: article.id,
    articleSlug: article.slug,
    status: 'building',
    stage: 'commit',
    commitSha: null,
    runId: null,
    runUrl: null,
    errorCode: null,
    errorMessage: null,
    fingerprint: null,
    checkedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.publishJobs.put(job)

  try {
    const { commitSha } = await client.unpublish(article.slug)
    job.commitSha = commitSha
    job.stage = 'build'
    job.status = 'building'
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)
    await db.articles.put({
      ...article,
      status: 'draft',
      remotePath: null,
      hasUnpublishedChanges: false,
      updatedAt: nowIso(),
    })
  } catch (error) {
    job.status = 'failed'
    job.errorCode = 'commit_failed'
    job.errorMessage = error instanceof Error ? error.message : '下线失败'
    job.updatedAt = nowIso()
    await db.publishJobs.put(job)
    await logError('unpublish', error)
    throw error
  }
}
