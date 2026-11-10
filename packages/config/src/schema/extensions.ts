import { z } from 'zod'

export const ExtensionPositionSchema = z.enum(['header', 'sidebar', 'footer'])
export type ExtensionPosition = z.infer<typeof ExtensionPositionSchema>

export const ExtensionItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    href: z.string().min(1),
    position: ExtensionPositionSchema.default('header'),
    order: z.number().default(0),
    enabled: z.boolean().default(true),
    icon: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough()

export type ExtensionItem = z.infer<typeof ExtensionItemSchema>

export const ExtensionsConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    items: z.array(ExtensionItemSchema).default([]),
  })
  .passthrough()

export type ExtensionsConfig = z.infer<typeof ExtensionsConfigSchema>
