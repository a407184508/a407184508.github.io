import type { Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'
import type { Element, ElementContent } from 'hast'

/** 移除已解析的 frontmatter 节点。 */
export function remarkRemoveFrontmatter() {
  return (tree: MdastRoot) => {
    tree.children = tree.children.filter((node) => node.type !== 'yaml')
  }
}

export function remarkRewriteAssetImages(resolve: (id: string) => string | null) {
  return (tree: MdastRoot) => {
    visit(tree, 'image', (node) => {
      if (!node.url.startsWith('asset:')) return
      const id = node.url.slice('asset:'.length)
      const url = resolve(id)
      if (url) {
        node.url = url
      } else {
        node.url = ''
      }
    })
  }
}

export function rehypeExternalLinks() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return
      const href = typeof node.properties?.href === 'string' ? node.properties.href : ''
      if (!href || href.startsWith('/') || href.startsWith('#')) return
      node.properties = {
        ...node.properties,
        target: '_blank',
        rel: ['noopener', 'noreferrer', 'external'],
      }
    })
  }
}

/** 表格外层加滚动容器，避免窄屏撑破布局。 */
export function rehypeTableWrapper() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || typeof index !== 'number') return
      if (parent.type !== 'root' && parent.children[index] === node) {
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'] },
          children: [node],
        }
        parent.children[index] = wrapper as ElementContent
      }
    })
  }
}

export interface TocEntry {
  id: string
  text: string
  depth: number
}

export function extractToc(tree: MdastRoot): TocEntry[] {
  const slugger = new GithubSlugger()
  const entries: TocEntry[] = []
  visit(tree, 'heading', (node) => {
    const text = node.children
      .map((child) => ('value' in child ? child.value : ''))
      .join('')
      .trim()
    if (!text) return
    entries.push({ id: slugger.slug(text), text, depth: node.depth })
  })
  return entries
}
