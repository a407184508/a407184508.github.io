import { sha256Hex, type Article, type Asset, type PublishJob } from '@blog/core'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { getDb } from './db'
import { SETTING_KEYS, getSetting, setSetting } from './settings'

interface BackupManifest {
  schemaVersion: number
  appVersion: string
  exportedAt: string
  files: Record<string, string>
}

const DATA_FILES = {
  articles: 'data/articles.json',
  publishJobs: 'data/publishJobs.json',
  settings: 'data/settings.json',
} as const

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/svg+xml') return 'svg'
  return 'bin'
}

function isBackupSetting(key: string): boolean {
  if (key === SETTING_KEYS.githubConnection) return false
  if (key === SETTING_KEYS.lastSession) return false
  if (key.startsWith(SETTING_KEYS.crashPrefix)) return false
  return true
}

export async function exportBackup(): Promise<Blob> {
  const db = getDb()
  const articles = await db.articles.toArray()
  const publishJobs = await db.publishJobs.toArray()
  const assets = await db.assets.toArray()
  const settings = (await db.settings.toArray()).filter((row) => isBackupSetting(row.key))

  const files: Record<string, Uint8Array> = {}
  const manifest: BackupManifest = {
    schemaVersion: 1,
    appVersion: '0.1.0',
    exportedAt: new Date().toISOString(),
    files: {},
  }

  const addFile = async (path: string, bytes: Uint8Array) => {
    files[path] = bytes
    manifest.files[path] = await sha256Hex(bytes)
  }

  await addFile(DATA_FILES.articles, strToU8(JSON.stringify(articles, null, 2)))
  await addFile(DATA_FILES.publishJobs, strToU8(JSON.stringify(publishJobs, null, 2)))
  await addFile(DATA_FILES.settings, strToU8(JSON.stringify(settings, null, 2)))

  for (const asset of assets) {
    const bytes = new Uint8Array(await asset.blob.arrayBuffer())
    await addFile(`assets/${asset.id}.${extFromMime(asset.mime)}`, bytes)
  }

  files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))

  const zipped = zipSync(files, { level: 6 })
  await setSetting(SETTING_KEYS.lastBackupAt, new Date().toISOString())
  return new Blob([zipped as unknown as BlobPart], { type: 'application/zip' })
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface ImportSummary {
  articlesAdded: number
  articlesUpdated: number
  articlesSkipped: number
  jobsAdded: number
  assetsAdded: number
  settingsRestored: number
}

export class BackupError extends Error {}

export async function importBackup(file: File): Promise<ImportSummary> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let unzipped: Record<string, Uint8Array>
  try {
    unzipped = unzipSync(bytes)
  } catch {
    throw new BackupError('无法解压备份包，文件可能已损坏')
  }

  const manifestBytes = unzipped['manifest.json']
  if (!manifestBytes) throw new BackupError('备份包缺少 manifest.json')
  let manifest: BackupManifest
  try {
    manifest = JSON.parse(strFromU8(manifestBytes)) as BackupManifest
  } catch {
    throw new BackupError('manifest.json 格式错误')
  }
  if (manifest.schemaVersion > 1) throw new BackupError('备份包版本过高，请升级应用后再导入')

  for (const [path, hash] of Object.entries(manifest.files)) {
    const entry = unzipped[path]
    if (!entry) throw new BackupError(`备份包缺少文件：${path}`)
    const actual = await sha256Hex(entry)
    if (actual !== hash) throw new BackupError(`文件校验失败：${path}`)
  }

  const articles = JSON.parse(strFromU8(unzipped[DATA_FILES.articles]!)) as Article[]
  const jobs = JSON.parse(strFromU8(unzipped[DATA_FILES.publishJobs]!)) as PublishJob[]
  const settings = JSON.parse(strFromU8(unzipped[DATA_FILES.settings]!)) as Array<{ key: string; value: unknown }>

  const db = getDb()
  const summary: ImportSummary = {
    articlesAdded: 0,
    articlesUpdated: 0,
    articlesSkipped: 0,
    jobsAdded: 0,
    assetsAdded: 0,
    settingsRestored: 0,
  }

  await db.transaction('rw', db.articles, db.publishJobs, db.assets, db.settings, async () => {
    for (const article of articles) {
      const existing = await db.articles.get(article.id)
      if (!existing) {
        await db.articles.add(article)
        summary.articlesAdded += 1
      } else if (article.updatedAt > existing.updatedAt) {
        await db.articles.put({ ...article, status: existing.status === 'publishing' ? 'draft' : article.status })
        summary.articlesUpdated += 1
      } else {
        summary.articlesSkipped += 1
      }
    }

    for (const job of jobs) {
      if (!(await db.publishJobs.get(job.id))) {
        await db.publishJobs.add(job)
        summary.jobsAdded += 1
      }
    }

    for (const [path, entry] of Object.entries(unzipped)) {
      if (!path.startsWith('assets/')) continue
      const id = path.slice('assets/'.length).split('.')[0]
      if (!id || (await db.assets.get(id))) continue
      const mime = path.endsWith('.png')
        ? 'image/png'
        : path.endsWith('.jpg')
          ? 'image/jpeg'
          : path.endsWith('.webp')
            ? 'image/webp'
            : 'application/octet-stream'
      const asset: Asset = {
        id,
        blob: new Blob([entry as unknown as BlobPart], { type: mime }),
        mime,
        size: entry.byteLength,
        createdAt: new Date().toISOString(),
      }
      await db.assets.add(asset)
      summary.assetsAdded += 1
    }

    for (const row of settings) {
      if (!isBackupSetting(row.key)) continue
      await db.settings.put(row)
      summary.settingsRestored += 1
    }
  })

  return summary
}

export async function getLastBackupAt(): Promise<string | null> {
  return getSetting<string>(SETTING_KEYS.lastBackupAt)
}
