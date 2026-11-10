import { z } from 'zod'

export const SiteConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().min(1),
    description: z.string().default(''),
    author: z.string().default(''),
    url: z.string().url(),
    locale: z.string().default('zh-CN'),
    footer: z
      .object({
        text: z.string().default(''),
        since: z.number().int().optional(),
      })
      .passthrough()
      .optional(),
    theme: z
      .object({
        accent: z.string().default('#3b6cf0'),
        radius: z.string().default('10px'),
      })
      .passthrough()
      .default({ accent: '#3b6cf0', radius: '10px' }),
  })
  .passthrough()

export type SiteConfig = z.infer<typeof SiteConfigSchema>
