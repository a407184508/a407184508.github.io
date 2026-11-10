/** 长图分页：纯函数，输入块高度，输出每页包含的块下标。 */

export type BlockKind = 'text' | 'heading' | 'code' | 'table' | 'image'

export interface BlockMetric {
  height: number
  kind?: BlockKind
  /** 与下一个块绑定在同一页（标题不得单独留在页尾）。 */
  keepWithNext?: boolean
}

export interface PageSlice {
  indexes: number[]
  /** 该页包含超过整页高度的单块，导出时需降级处理。 */
  overflow: BlockKind | null
}

export interface PaginateOptions {
  /** 每页可用内容高度（已扣除内边距与页脚）。 */
  pageHeight: number
  /** 块之间的垂直间距。 */
  gap?: number
  maxPages?: number
}

/** 贪心装箱：标题组整体下移，超页块单独成页并标记 overflow。 */
export function paginateBlocks(blocks: BlockMetric[], options: PaginateOptions): PageSlice[] {
  const { pageHeight, gap = 0, maxPages = 200 } = options
  if (blocks.length === 0 || pageHeight <= 0) return []

  const groups: number[][] = []
  for (let i = 0; i < blocks.length; i += 1) {
    const group = [i]
    let cursor = i
    while (blocks[cursor]?.keepWithNext && cursor + 1 < blocks.length) {
      cursor += 1
      group.push(cursor)
    }
    groups.push(group)
    i = cursor
  }

  const pages: PageSlice[] = []
  let indexes: number[] = []
  let overflow: BlockKind | null = null
  let used = 0

  const flush = () => {
    if (indexes.length > 0) pages.push({ indexes, overflow })
    indexes = []
    overflow = null
    used = 0
  }

  const place = (index: number, height: number) => {
    const extra = indexes.length > 0 ? gap : 0
    if (indexes.length > 0 && used + extra + height > pageHeight) flush()
    const offset = indexes.length > 0 ? gap : 0
    if (indexes.length === 0 && height > pageHeight) overflow = blocks[index]?.kind ?? 'text'
    indexes.push(index)
    used += offset + height
  }

  for (const group of groups) {
    const groupHeight = group.reduce(
      (sum, index, position) => sum + (blocks[index]?.height ?? 0) + (position > 0 ? gap : 0),
      0,
    )
    if (groupHeight <= pageHeight) {
      const extra = indexes.length > 0 ? gap : 0
      if (indexes.length > 0 && used + extra + groupHeight > pageHeight) flush()
    }
    for (const index of group) place(index, blocks[index]?.height ?? 0)
  }
  flush()

  return pages.slice(0, maxPages)
}

/** 内容高度超过画布上限时是否必须分页。 */
export function exceedsCanvasLimit(contentHeight: number, pixelRatio: number, limit = 16384): boolean {
  return contentHeight * pixelRatio > limit
}
