import { getDb } from './db'

export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await getDb().settings.get(key)
  return (row?.value as T | undefined) ?? null
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getDb().settings.put({ key, value })
}

export async function deleteSetting(key: string): Promise<void> {
  await getDb().settings.delete(key)
}

export const SETTING_KEYS = {
  githubConnection: 'github.connection',
  lastBackupAt: 'lastBackupAt',
  lastSession: 'lastSession',
  editorPreferences: 'editor.preferences',
  crashPrefix: 'crash:',
} as const

export function crashKey(articleId: string): string {
  return `${SETTING_KEYS.crashPrefix}${articleId}`
}
