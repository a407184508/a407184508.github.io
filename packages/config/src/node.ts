import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { z } from 'zod'
import { ExtensionsConfigSchema, type ExtensionsConfig } from './schema/extensions'
import { NavigationConfigSchema, type NavigationConfig } from './schema/navigation'
import { SiteConfigSchema, type SiteConfig } from './schema/site'
import { TagsConfigSchema, type TagsConfig } from './schema/tags'

export interface ConfigIssue {
  file: string
  message: string
}

export interface ProjectConfig {
  site: SiteConfig
  navigation: NavigationConfig
  tags: TagsConfig
  extensions: ExtensionsConfig
  errors: ConfigIssue[]
  warnings: ConfigIssue[]
}

const MAX_FILE_BYTES = 64 * 1024
const MAX_DEPTH = 6

function checkFile(file: string, fullPath: string, errors: ConfigIssue[]): string | null {
  try {
    const stat = statSync(fullPath)
    if (stat.size > MAX_FILE_BYTES) {
      errors.push({ file, message: `文件超过 64KB（${stat.size} 字节）` })
      return null
    }
    return readFileSync(fullPath, 'utf8')
  } catch {
    errors.push({ file, message: '文件不存在或无法读取' })
    return null
  }
}

function checkDepth(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false
  if (Array.isArray(value)) return value.every((item) => checkDepth(item, depth + 1))
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every((item) => checkDepth(item, depth + 1))
  }
  return true
}

function parseJson(file: string, raw: string, errors: ConfigIssue[]): unknown | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!checkDepth(parsed)) {
      errors.push({ file, message: 'JSON 嵌套超过 6 层，请简化配置' })
      return null
    }
    return parsed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON 语法错误'
    errors.push({ file, message: `JSON 解析失败：${message}` })
    return null
  }
}

function collectZodIssues(file: string, error: z.ZodError, warnings: ConfigIssue[]): void {
  for (const issue of error.issues) {
    warnings.push({ file, message: `${issue.path.join('.') || '(root)'}：${issue.message}` })
  }
}

function readConfig<T>(
  root: string,
  name: string,
  schema: z.ZodTypeAny,
  fallback: T,
  errors: ConfigIssue[],
  warnings: ConfigIssue[],
): T {
  const file = `site.config/${name}`
  const raw = checkFile(file, join(root, 'site.config', name), errors)
  if (raw === null) return fallback
  const parsed = parseJson(file, raw, errors)
  if (parsed === null) return fallback
  const result = schema.safeParse(parsed)
  if (!result.success) {
    collectZodIssues(file, result.error, warnings)
    return fallback
  }
  return result.data as T
}

/** 构建期读取并校验四类站点配置。 */
export function loadProjectConfig(root: string): ProjectConfig {
  const errors: ConfigIssue[] = []
  const warnings: ConfigIssue[] = []

  const site = readConfig<SiteConfig>(
    root,
    'site.json',
    SiteConfigSchema,
    {
      schemaVersion: 1,
      title: '未命名站点',
      description: '',
      author: '',
      url: 'https://example.github.io',
      locale: 'zh-CN',
      theme: { accent: '#3b6cf0', radius: '10px' },
    },
    errors,
    warnings,
  )

  const navigation = readConfig<NavigationConfig>(
    root,
    'navigation.json',
    NavigationConfigSchema,
    { schemaVersion: 1, items: [] },
    errors,
    warnings,
  )

  const tags = readConfig<TagsConfig>(
    root,
    'tags.json',
    TagsConfigSchema,
    { schemaVersion: 1, tags: [] },
    errors,
    warnings,
  )
  const extensions = readConfig<ExtensionsConfig>(
    root,
    'extensions.json',
    ExtensionsConfigSchema,
    { schemaVersion: 1, items: [] },
    errors,
    warnings,
  )

  const seenTagSlugs = new Set<string>()
  for (const tag of tags.tags ?? []) {
    if (seenTagSlugs.has(tag.slug)) {
      warnings.push({ file: 'site.config/tags.json', message: `标签 slug 重复：“${tag.slug}”，已保留第一个` })
    }
    seenTagSlugs.add(tag.slug)
  }

  const seenNavIds = new Set<string>()
  for (const item of navigation.items ?? []) {
    if (seenNavIds.has(item.id)) {
      warnings.push({ file: 'site.config/navigation.json', message: `导航 id 重复：“${item.id}”，已合并` })
    }
    seenNavIds.add(item.id)
  }

  return { site, navigation, tags, extensions, errors, warnings }
}

export interface ValidateResult {
  errors: ConfigIssue[]
  warnings: ConfigIssue[]
}

/** `pnpm build` 与 `pnpm dev` 前执行；errors 非空则构建失败。 */
export function validateProject(root: string): ValidateResult {
  const { errors, warnings } = loadProjectConfig(root)

  const contentDir = join(root, 'content', 'posts')
  const seen = new Set<string>()
  try {
    for (const entry of readdirSync(contentDir)) {
      if (!entry.endsWith('.md')) continue
      const slug = entry.slice(0, -3)
      if (seen.has(slug)) {
        errors.push({ file: relative(root, join(contentDir, entry)), message: `文章 slug 重复：${slug}` })
      }
      seen.add(slug)
    }
  } catch {
    warnings.push({ file: 'content/posts', message: '未找到内容目录，站点将没有文章' })
  }

  return { errors, warnings }
}
