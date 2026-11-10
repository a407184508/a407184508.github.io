import type { Element, Root as HastRoot } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { contentSanitizeSchema } from './render'
import { remarkRemoveFrontmatter, remarkRewriteAssetImages } from './plugins'

export interface WechatTheme {
  id: string
  label: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  color: string
  muted: string
  accent: string
  background: string
  headingStyle: 'accent-bar' | 'underline' | 'plain'
  paragraphSpacing: string
}

export const WECHAT_THEMES: WechatTheme[] = [
  {
    id: 'default',
    label: '清爽蓝',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#2c3038',
    muted: '#6b7280',
    accent: '#3b6cf0',
    background: '#ffffff',
    headingStyle: 'accent-bar',
    paragraphSpacing: '1.1em',
  },
  {
    id: 'serif',
    label: '思源宋体',
    fontFamily: "'Songti SC', 'Noto Serif SC', Georgia, serif",
    fontSize: '16px',
    lineHeight: '1.9',
    color: '#33302b',
    muted: '#7a7368',
    accent: '#8a6d3b',
    background: '#fffdf9',
    headingStyle: 'underline',
    paragraphSpacing: '1.2em',
  },
]

export function getWechatTheme(id: string): WechatTheme {
  return WECHAT_THEMES.find((theme) => theme.id === id) ?? WECHAT_THEMES[0]!
}

function styleString(styles: Record<string, string | undefined>): string {
  return Object.entries(styles)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

function inlineTheme(theme: WechatTheme): Plugin<[], HastRoot> {
  return () => (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, _index, parent) => {
      const set = (styles: Record<string, string | undefined>) => {
        node.properties = { ...node.properties, style: styleString(styles) }
      }
      switch (node.tagName) {
        case 'h1':
          set({
            'font-size': '22px',
            'font-weight': '700',
            color: theme.color,
            margin: '1.4em 0 0.8em',
            'line-height': '1.35',
            ...(theme.headingStyle === 'accent-bar'
              ? { 'border-left': `4px solid ${theme.accent}`, 'padding-left': '12px' }
              : {}),
            ...(theme.headingStyle === 'underline'
              ? { 'border-bottom': `1px solid ${theme.accent}`, 'padding-bottom': '6px' }
              : {}),
          })
          break
        case 'h2':
          set({
            'font-size': '19px',
            'font-weight': '700',
            color: theme.color,
            margin: '1.4em 0 0.7em',
            'line-height': '1.4',
            ...(theme.headingStyle === 'accent-bar'
              ? { 'border-left': `4px solid ${theme.accent}`, 'padding-left': '12px' }
              : {}),
            ...(theme.headingStyle === 'underline'
              ? { 'border-bottom': `1px solid ${theme.accent}`, 'padding-bottom': '6px' }
              : {}),
          })
          break
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          set({
            'font-size': '17px',
            'font-weight': '600',
            color: theme.color,
            margin: '1.2em 0 0.6em',
            'line-height': '1.4',
          })
          break
        case 'p':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            'font-size': theme.fontSize,
            'line-height': theme.lineHeight,
            color: theme.color,
            'letter-spacing': '0.02em',
          })
          break
        case 'blockquote':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '0.6em 1em',
            'border-left': `3px solid ${theme.accent}`,
            background: '#f6f8fc',
            color: theme.muted,
            'border-radius': '4px',
          })
          break
        case 'ul':
        case 'ol':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '0 0 0 1.6em',
            'font-size': theme.fontSize,
            'line-height': theme.lineHeight,
            color: theme.color,
          })
          break
        case 'li':
          set({ margin: '0 0 0.4em' })
          break
        case 'a':
          set({ color: theme.accent, 'text-decoration': 'none', 'word-break': 'break-all' })
          break
        case 'strong':
          set({ 'font-weight': '700', color: theme.color })
          break
        case 'em':
          set({ 'font-style': 'italic' })
          break
        case 'code':
          if (parent && parent.type === 'element' && parent.tagName === 'pre') {
            set({ 'font-family': 'Menlo, Consolas, Monaco, monospace', 'font-size': '13px', color: '#e6edf3' })
          } else {
            set({
              'font-family': 'Menlo, Consolas, Monaco, monospace',
              'font-size': '14px',
              color: '#c7254e',
              background: '#f5f6f8',
              padding: '2px 5px',
              'border-radius': '3px',
            })
          }
          break
        case 'pre':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '14px 16px',
            background: '#1f2430',
            color: '#e6edf3',
            'border-radius': '6px',
            'overflow-x': 'auto',
            'font-size': '13px',
            'line-height': '1.6',
          })
          break
        case 'img':
          set({ 'max-width': '100%', height: 'auto', display: 'block', margin: '0 auto 1em', 'border-radius': '4px' })
          break
        case 'hr':
          set({ border: 'none', 'border-top': `1px solid #e5e7eb`, margin: '1.8em 0' })
          break
        case 'table':
          set({ width: '100%', 'border-collapse': 'collapse', margin: `0 0 ${theme.paragraphSpacing}`, 'font-size': '14px' })
          break
        case 'th':
          set({ border: '1px solid #e5e7eb', padding: '8px', background: '#f6f8fc', 'font-weight': '600', color: theme.color })
          break
        case 'td':
          set({ border: '1px solid #e5e7eb', padding: '8px', color: theme.color })
          break
        case 'input':
          node.properties = { ...node.properties, style: 'display:none' }
          break
        default:
          break
      }
    })
  }
}

export interface WechatRenderOptions {
  themeId?: string
  resolveAssetUrl?: (assetId: string) => string | null
}

/** 生成可直接粘贴到公众号的富文本（全部内联样式，无 <style>）。 */
export async function renderWechatHtml(markdown: string, options: WechatRenderOptions = {}): Promise<string> {
  const theme = getWechatTheme(options.themeId ?? 'default')
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkRemoveFrontmatter)
    .use(remarkRewriteAssetImages, (id: string) => (options.resolveAssetUrl ? options.resolveAssetUrl(id) : null))
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, contentSanitizeSchema)
    .use(rehypeSlug)
    .use(inlineTheme(theme))
    .use(rehypeStringify)

  const file = await processor.process(markdown)
  const containerStyle = styleString({
    'font-family': theme.fontFamily,
    'font-size': theme.fontSize,
    'line-height': theme.lineHeight,
    color: theme.color,
    background: theme.background,
    'word-break': 'break-word',
    'letter-spacing': '0.02em',
  })
  return `<section style="${containerStyle}">${String(file)}</section>`
}
