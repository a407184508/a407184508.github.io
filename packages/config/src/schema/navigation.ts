import { z } from 'zod'

export const NavPositionSchema = z.enum(['header', 'footer'])
export type NavPosition = z.infer<typeof NavPositionSchema>

export const NavigationItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    href: z.string().min(1),
    position: NavPositionSchema.default('header'),
    order: z.number().default(0),
    enabled: z.boolean().default(true),
  })
  .passthrough()

export type NavigationItem = z.infer<typeof NavigationItemSchema>

export const NavigationConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    items: z.array(NavigationItemSchema).default([]),
  })
  .passthrough()

export type NavigationConfig = z.infer<typeof NavigationConfigSchema>
