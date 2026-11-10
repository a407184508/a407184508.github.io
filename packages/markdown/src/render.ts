import type { Root as MdastRoot } from 'mdast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'
import { extractToc, rehypeExternalLinks, rehypeTableWrapper, remarkRemoveFrontmatter, remarkRewriteAssetImages, type TocEntry } from './plugins'

const baseAttributes = defaultSchema.attributes ?? {}

export const contentSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'figure', 'figcaption', 'del', 'input', 'picture', 'source'],
  attributes: {
    ...baseAttributes,
    a: [...(baseAttributes.a ?? []), 'target', 'rel'],
    img: [...(baseAttributes.img ?? []), 'loading', 'width', 'height'],
    input: ['type', 'checked', 'disabled'],
    source: ['srcset', 'type', 'media'],
  },
}

export interface RenderMarkdownOptions {
  /** 正文中的 asset:<id> 解析为可访问 URL；不传则保留原样。 */
  resolveAssetUrl?: (assetId: string) => string | null
  highlight?: boolean
  highlightTheme?: string
}

export interface RenderMarkdownResult {
  html: string
  toc: TocEntry[]
}

function assetResolver(options: RenderMarkdownOptions) {
  return (id: string) => {
    if (!options.resolveAssetUrl) return null
    return options.resolveAssetUrl(id)
  }
}

export async function renderMarkdown(
  markdown: string,
  options: RenderMarkdownOptions = {},
): Promise<RenderMarkdownResult> {
  const { highlight = true, highlightTheme = 'github-light' } = options
  const resolve = assetResolver(options)

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkRemoveFrontmatter)
    .use(remarkRewriteAssetImages, resolve)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, contentSanitizeSchema)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['heading-anchor'], ariaLabel: '链接到本节' },
    })
    .use(rehypeExternalLinks)
    .use(rehypeTableWrapper)

  if (highlight) {
    processor.use(rehypeShiki, {
      theme: highlightTheme,
      fallbackLanguage: 'text',
    })
  }

  processor.use(rehypeStringify)

  const file = await processor.process(markdown)
  const tocTree = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter, ['yaml']).parse(markdown) as MdastRoot

  return { html: String(file), toc: extractToc(tocTree) }
}

/** 应用内预览：asset 引用由调用方提供 object URL。 */
export function createAssetUrlResolver(map: Map<string, string>) {
  return (id: string): string | null => map.get(id) ?? null
}
