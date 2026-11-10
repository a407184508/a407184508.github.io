import Dexie, { type Table } from 'dexie'
import type { Article, Asset, PublishJob } from '@blog/core'
import { DB_NAME } from '@blog/core'

export interface SettingRow {
  key: string
  value: unknown
}

export interface ErrorLogRow {
  id?: number
  at: string
  level: 'info' | 'warn' | 'error'
  scope: string
  message: string
}

export interface CrashSnapshot {
  articleId: string
  content: string
  title: string
  savedAt: string
}

export class BlogDatabase extends Dexie {
  articles!: Table<Article, string>
  publishJobs!: Table<PublishJob, string>
  assets!: Table<Asset, string>
  settings!: Table<SettingRow, string>
  errorLogs!: Table<ErrorLogRow, number>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      articles: 'id, &slug, status, updatedAt, publishedAt',
      publishJobs: 'id, articleId, status, createdAt',
      assets: 'id, createdAt, mime',
      settings: 'key',
      errorLogs: '++id, at',
    })
  }
}

let instance: BlogDatabase | null = null

export function getDb(): BlogDatabase {
  if (typeof window === 'undefined') {
    throw new Error('数据库只能在浏览器中使用')
  }
  if (!instance) instance = new BlogDatabase()
  return instance
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}
