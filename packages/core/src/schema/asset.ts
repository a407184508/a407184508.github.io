import { z } from 'zod'

export const AssetSchema = z.object({
  id: z.string(),
  blob: z.instanceof(Blob),
  mime: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.number(),
  createdAt: z.string(),
})

export type Asset = z.infer<typeof AssetSchema>

export const SettingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
})

export type Setting = z.infer<typeof SettingSchema>

/** 编辑器偏好，仅存 localStorage。 */
export interface EditorPreferences {
  fontSize: number
  lineWrapping: boolean
  theme: 'light' | 'dark'
  previewMode: 'split' | 'source' | 'preview'
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 15,
  lineWrapping: true,
  theme: 'light',
  previewMode: 'split',
}

/** 站内图片引用：![](asset:<sha256>) */
export const ASSET_URL_PREFIX = 'asset:'

export function extractAssetIds(content: string): string[] {
  const ids = new Set<string>()
  const pattern = /asset:([a-zA-Z0-9-]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) ids.add(match[1])
  }
  return [...ids]
}
