import { z } from 'zod'

export const TagConfigSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    displayName: z.string().optional(),
    color: z.string().optional(),
    order: z.number().default(0),
    group: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough()

export type TagConfig = z.infer<typeof TagConfigSchema>

export const TagsConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    tags: z.array(TagConfigSchema).default([]),
  })
  .passthrough()

export type TagsConfig = z.infer<typeof TagsConfigSchema>
