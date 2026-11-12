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

export type HeadingStyle = 'accent-bar' | 'underline' | 'pill' | 'bold-plain'

export interface CardTheme {
  id: string
  label: string
  /** 整页背景：纯色 / 渐变（作为页面 background） */
  background: string
  /** 内容卡片背景；透明则露出页面背景 */
  cardBg: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  color: string
  muted: string
  accent: string
  headingStyle: HeadingStyle
  paragraphSpacing: string
  /** 卡片内边距（会被页面外层的 padding 再加一层） */
  padding: string
  /** 是否需要圆角卡片 */
  rounded: boolean
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'xhs-purple',
    label: '紫色小红书',
    background: 'linear-gradient(135deg, #ff6b9d 0%, #c471ed 55%, #7367f0 100%)',
    cardBg: 'rgba(255,255,255,0.96)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: '18px',
    lineHeight: '1.85',
    color: '#2a2338',
    muted: '#6b6375',
    accent: '#7367f0',
    headingStyle: 'pill',
    paragraphSpacing: '1.1em',
    padding: '40px 44px',
    rounded: true,
  },
  {
    id: 'minimal-gray',
    label: '简约高级灰',
    background: '#f5f5f7',
    cardBg: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
    fontSize: '17px',
    lineHeight: '1.85',
    color: '#1d1d1f',
    muted: '#6e6e73',
    accent: '#1d1d1f',
    headingStyle: 'bold-plain',
    paragraphSpacing: '1.15em',
    padding: '48px 52px',
    rounded: true,
  },
  {
    id: 'warm',
    label: '温暖柔和',
    background: 'linear-gradient(135deg, #ffe0c2 0%, #ffd6d6 100%)',
    cardBg: 'rgba(255,255,255,0.92)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: '18px',
    lineHeight: '1.9',
    color: '#4a3a2a',
    muted: '#8a7560',
    accent: '#e07a3f',
    headingStyle: 'accent-bar',
    paragraphSpacing: '1.1em',
    padding: '44px 48px',
    rounded: true,
  },
  {
    id: 'dreamy',
    label: '梦幻渐变',
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cardBg: 'rgba(255,255,255,0.88)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    fontSize: '18px',
    lineHeight: '1.85',
    color: '#34344a',
    muted: '#6c6c85',
    accent: '#8e7cc3',
    headingStyle: 'underline',
    paragraphSpacing: '1.1em',
    padding: '44px 50px',
    rounded: true,
  },
  {
    id: 'nature',
    label: '清新自然',
    background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    cardBg: 'rgba(255,255,255,0.94)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    fontSize: '17px',
    lineHeight: '1.85',
    color: '#2c3a2e',
    muted: '#5d6f5f',
    accent: '#2f9e44',
    headingStyle: 'accent-bar',
    paragraphSpacing: '1.1em',
    padding: '44px 50px',
    rounded: true,
  },
  {
    id: 'mono',
    label: '极简黑白',
    background: '#ffffff',
    cardBg: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
    fontSize: '17px',
    lineHeight: '1.9',
    color: '#111111',
    muted: '#777777',
    accent: '#111111',
    headingStyle: 'underline',
    paragraphSpacing: '1.15em',
    padding: '48px 52px',
    rounded: false,
  },
  {
    id: 'apple-notes',
    label: '苹果备忘录',
    background: '#fffdf5',
    cardBg: '#fffdf5',
    fontFamily: "'Noto Serif SC', 'Songti SC', Georgia, serif",
    fontSize: '17px',
    lineHeight: '1.9',
    color: '#1d1d1f',
    muted: '#7a7a7a',
    accent: '#f5c518',
    headingStyle: 'bold-plain',
    paragraphSpacing: '1.1em',
    padding: '48px 52px',
    rounded: false,
  },
  {
    id: 'glass',
    label: '玻璃拟态',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: 'rgba(255,255,255,0.18)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    fontSize: '17px',
    lineHeight: '1.85',
    color: '#ffffff',
    muted: 'rgba(255,255,255,0.78)',
    accent: '#ffffff',
    headingStyle: 'bold-plain',
    paragraphSpacing: '1.1em',
    padding: '46px 50px',
    rounded: true,
  },
  {
    id: 'business',
    label: '商务简报',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
    cardBg: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    fontSize: '17px',
    lineHeight: '1.8',
    color: '#1f2937',
    muted: '#6b7280',
    accent: '#1e3a8a',
    headingStyle: 'accent-bar',
    paragraphSpacing: '1.05em',
    padding: '44px 50px',
    rounded: true,
  },
  {
    id: 'bytedance',
    label: '字节范',
    background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
    cardBg: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    fontSize: '17px',
    lineHeight: '1.85',
    color: '#1f2937',
    muted: '#64748b',
    accent: '#0ea5e9',
    headingStyle: 'pill',
    paragraphSpacing: '1.1em',
    padding: '44px 50px',
    rounded: true,
  },
  {
    id: 'typewriter',
    label: '复古打字机',
    background: '#f4ecd8',
    cardBg: '#fbf6e8',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '16px',
    lineHeight: '1.9',
    color: '#3a2e1f',
    muted: '#7a6a52',
    accent: '#8b5a2b',
    headingStyle: 'underline',
    paragraphSpacing: '1.15em',
    padding: '46px 52px',
    rounded: false,
  },
  {
    id: 'watercolor',
    label: '水彩艺术',
    background: 'linear-gradient(135deg, #fff1f2 0%, #fef3c7 50%, #dbeafe 100%)',
    cardBg: 'rgba(255,255,255,0.82)',
    fontFamily: "'Noto Serif SC', 'Songti SC', Georgia, serif",
    fontSize: '17px',
    lineHeight: '1.9',
    color: '#3b2f2a',
    muted: '#7a6a62',
    accent: '#db2777',
    headingStyle: 'bold-plain',
    paragraphSpacing: '1.15em',
    padding: '46px 52px',
    rounded: true,
  },
]

export function getCardTheme(id: string): CardTheme {
  return CARD_THEMES.find((theme) => theme.id === id) ?? CARD_THEMES[0]!
}

function styleString(styles: Record<string, string | undefined>): string {
  return Object.entries(styles)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

function headingDecoration(theme: CardTheme): Record<string, string | undefined> {
  switch (theme.headingStyle) {
    case 'accent-bar':
      return { 'border-left': `4px solid ${theme.accent}`, 'padding-left': '14px' }
    case 'underline':
      return { 'border-bottom': `2px solid ${theme.accent}`, 'padding-bottom': '8px' }
    case 'pill':
      return {
        background: theme.accent,
        color: '#ffffff',
        'border-radius': '8px',
        padding: '6px 16px',
        display: 'inline-block',
      }
    case 'bold-plain':
    default:
      return {}
  }
}

function inlineCardTheme(theme: CardTheme): Plugin<[], HastRoot> {
  return () => (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, _index, parent) => {
      const set = (styles: Record<string, string | undefined>) => {
        node.properties = { ...node.properties, style: styleString(styles) }
      }
      const onDark = theme.cardBg.startsWith('rgba') && parseFloat(theme.cardBg.slice(5)) < 0.3
      const codeBg = onDark ? 'rgba(0,0,0,0.25)' : '#f3f4f7'
      const quoteBg = onDark ? 'rgba(255,255,255,0.12)' : '#f6f7fb'
      switch (node.tagName) {
        case 'h1':
          set({
            'font-size': '28px',
            'font-weight': '800',
            color: theme.color,
            margin: '0.2em 0 0.9em',
            'line-height': '1.3',
            'letter-spacing': '0.01em',
            ...headingDecoration(theme),
          })
          break
        case 'h2':
          set({
            'font-size': '23px',
            'font-weight': '700',
            color: theme.color,
            margin: '1.5em 0 0.7em',
            'line-height': '1.35',
            ...headingDecoration(theme),
          })
          break
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          set({
            'font-size': '19px',
            'font-weight': '700',
            color: theme.color,
            margin: '1.3em 0 0.6em',
            'line-height': '1.4',
          })
          break
        case 'p':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            'font-size': theme.fontSize,
            'line-height': theme.lineHeight,
            color: theme.color,
            'letter-spacing': '0.01em',
            'word-break': 'break-word',
          })
          break
        case 'blockquote':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '0.7em 1.1em',
            'border-left': `4px solid ${theme.accent}`,
            background: quoteBg,
            color: theme.muted,
            'border-radius': '6px',
            'font-size': theme.fontSize,
            'line-height': theme.lineHeight,
          })
          break
        case 'ul':
        case 'ol':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '0 0 0 1.7em',
            'font-size': theme.fontSize,
            'line-height': theme.lineHeight,
            color: theme.color,
          })
          break
        case 'li':
          set({ margin: '0 0 0.5em' })
          break
        case 'a':
          set({ color: theme.accent, 'text-decoration': 'none', 'word-break': 'break-all' })
          break
        case 'strong':
          set({ 'font-weight': '800', color: theme.color })
          break
        case 'em':
          set({ 'font-style': 'italic' })
          break
        case 'code':
          if (parent && parent.type === 'element' && parent.tagName === 'pre') {
            set({ 'font-family': 'Menlo, Consolas, Monaco, monospace', 'font-size': '14px', color: onDark ? '#e6edf3' : '#e6edf3' })
          } else {
            set({
              'font-family': 'Menlo, Consolas, Monaco, monospace',
              'font-size': '0.88em',
              color: theme.accent,
              background: codeBg,
              padding: '2px 6px',
              'border-radius': '4px',
            })
          }
          break
        case 'pre':
          set({
            margin: `0 0 ${theme.paragraphSpacing}`,
            padding: '14px 16px',
            background: '#1f2430',
            color: '#e6edf3',
            'border-radius': '8px',
            'overflow-x': 'auto',
            'font-size': '14px',
            'line-height': '1.65',
          })
          break
        case 'img':
          set({
            'max-width': '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto 1.2em',
            'border-radius': '10px',
          })
          break
        case 'hr':
          set({ border: 'none', 'border-top': `1px solid ${theme.muted}`, margin: '1.8em 0', opacity: '0.4' })
          break
        case 'table':
          set({ width: '100%', 'border-collapse': 'collapse', margin: `0 0 ${theme.paragraphSpacing}`, 'font-size': '15px' })
          break
        case 'th':
          set({ border: `1px solid ${theme.muted}`, padding: '8px 10px', background: quoteBg, 'font-weight': '700', color: theme.color })
          break
        case 'td':
          set({ border: `1px solid ${theme.muted}`, padding: '8px 10px', color: theme.color })
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

export interface CardRenderOptions {
  themeId?: string
  resolveAssetUrl?: (assetId: string) => string | null
}

/** 生成小红书风格知识卡片的内联样式 HTML。 */
export async function renderCardHtml(markdown: string, options: CardRenderOptions = {}): Promise<string> {
  const theme = getCardTheme(options.themeId ?? 'xhs-purple')
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkRemoveFrontmatter)
    .use(remarkRewriteAssetImages, (id: string) => (options.resolveAssetUrl ? options.resolveAssetUrl(id) : null))
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, contentSanitizeSchema)
    .use(rehypeSlug)
    .use(inlineCardTheme(theme))
    .use(rehypeStringify)

  const file = await processor.process(markdown)
  const bodyStyle = styleString({
    'font-family': theme.fontFamily,
    'font-size': theme.fontSize,
    'line-height': theme.lineHeight,
    color: theme.color,
    'word-break': 'break-word',
  })
  return `<div style="${bodyStyle}">${String(file)}</div>`
}
