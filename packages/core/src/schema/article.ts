import { z } from 'zod'

export const ArticleStatusSchema = z.enum(['draft', 'publishing', 'published', 'publish_failed'])
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>

const isoDate = z.string().datetime({ offset: true })

export const ArticleSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(120),
  summary: z.string().default(''),
  tags: z.array(z.string()).default([]),
  content: z.string().default(''),
  coverAssetId: z.string().nullable().default(null),
  date: isoDate,
  status: ArticleStatusSchema,
  hasUnpublishedChanges: z.boolean().default(false),
  publishedAt: isoDate.nullable().default(null),
  remotePath: z.string().nullable().default(null),
  lastPublishedHash: z.string().nullable().default(null),
  createdAt: isoDate,
  updatedAt: isoDate,
})

export type Article = z.infer<typeof ArticleSchema>

/** 本地编辑表单可写的字段。 */
export const ArticleInputSchema = z.object({
  title: z.string().min(1, '请填写标题').max(120, '标题不能超过 120 字'),
  slug: z
    .string()
    .min(1, '请填写 slug')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能使用小写字母、数字与连字符'),
  summary: z.string().max(200, '摘要不能超过 200 字').default(''),
  tags: z.array(z.string()).default([]),
  content: z.string().default(''),
  coverAssetId: z.string().nullable().default(null),
  date: isoDate,
})

export type ArticleInput = z.infer<typeof ArticleInputSchema>

/** content/posts/<slug>.md 的 frontmatter。 */
export const ArticleFrontmatterSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  date: isoDate,
  summary: z.string().default(''),
  tags: z.array(z.string()).default([]),
  cover: z.string().nullable().optional(),
  draft: z.boolean().optional(),
})

export type ArticleFrontmatter = z.infer<typeof ArticleFrontmatterSchema>

export function isPublishedStatus(status: ArticleStatus): boolean {
  return status === 'published' || status === 'publishing'
}
