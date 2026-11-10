import { getDb } from './db'

/** 本地错误日志：环形缓冲，最多保留 200 条。 */
export async function logError(scope: string, error: unknown, level: 'info' | 'warn' | 'error' = 'error'): Promise<void> {
  try {
    const db = getDb()
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    await db.errorLogs.add({ at: new Date().toISOString(), level, scope, message })
    const count = await db.errorLogs.count()
    if (count > 200) {
      const oldest = await db.errorLogs.orderBy('at').limit(count - 200).toArray()
      await db.errorLogs.bulkDelete(oldest.map((row) => row.id!).filter(Boolean))
    }
  } catch {
    // 日志失败不应影响主流程
  }
}

export async function listErrorLogs(limit = 50) {
  const db = getDb()
  const all = await db.errorLogs.orderBy('at').reverse().limit(limit).toArray()
  return all
}
