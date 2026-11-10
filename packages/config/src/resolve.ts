import { isSafeHref, uniqueSlug, toSlug } from '@blog/core'
import type { ExtensionItem } from './schema/extensions'
import type { NavigationItem } from './schema/navigation'
import type { TagConfig } from './schema/tags'

function byOrderThenLabel<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order
}

export function resolveNavigation(items: NavigationItem[]): NavigationItem[] {
  const seen = new Set<string>()
  const result: NavigationItem[] = []
  for (const item of items) {
    if (!item.enabled) continue
    if (seen.has(item.id)) continue
    if (!isSafeHref(item.href)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result.sort(byOrderThenLabel)
}

export function resolveExtensions(items: ExtensionItem[]): ExtensionItem[] {
  const seen = new Set<string>()
  const result: ExtensionItem[] = []
  for (const item of items) {
    if (!item.enabled) continue
    if (seen.has(item.id)) continue
    if (!isSafeHref(item.href)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result.sort(byOrderThenLabel)
}

export interface ResolvedTag extends TagConfig {
  displayName: string
}

export function resolveTags(tags: TagConfig[]): ResolvedTag[] {
  const seen = new Set<string>()
  const result: ResolvedTag[] = []
  for (const tag of tags) {
    if (seen.has(tag.name)) continue
    seen.add(tag.name)
    result.push({ ...tag, displayName: tag.displayName ?? tag.name })
  }
  return result.sort(byOrderThenLabel)
}

/**
 * tags.json 未声明的标签：生成稳定 ASCII slug。
 * 纯中文转写失败时使用 tag-<hash4>，冲突时追加序号。
 */
export function ensureTagSlugs(names: string[], declared: ResolvedTag[]): Array<{ name: string; slug: string }> {
  const result = declared.map((tag) => ({ name: tag.name, slug: tag.slug }))
  const taken = new Set(result.map((tag) => tag.slug))
  const declaredNames = new Set(result.map((tag) => tag.name))
  for (const name of names) {
    if (declaredNames.has(name)) continue
    const base = toSlug(name, 'tag')
    const slug = uniqueSlug(base, taken)
    taken.add(slug)
    result.push({ name, slug })
  }
  return result
}
