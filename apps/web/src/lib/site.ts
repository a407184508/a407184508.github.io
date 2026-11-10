import { cache } from 'react'
import { resolveExtensions, resolveNavigation } from '@blog/config'
import { getConfig } from './content'

export const getNavigation = cache(() => {
  const config = getConfig()
  const items = resolveNavigation(config.navigation.items)
  return {
    header: items.filter((item) => item.position === 'header'),
    footer: items.filter((item) => item.position === 'footer'),
  }
})

export const getExtensions = cache(() => {
  const config = getConfig()
  return resolveExtensions(config.extensions.items)
})
