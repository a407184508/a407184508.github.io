/** 基础 slug 规则：小写、数字、连字符，不含中文与符号。 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_·、。，,/\\]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function hash4(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 4)
}

/** 无法转写（如纯中文）时生成稳定的回退 slug。 */
export function toSlug(input: string, fallbackPrefix = 'post'): string {
  const base = slugify(input)
  if (base) return base
  return `${fallbackPrefix}-${hash4(input)}`
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

/** 追加序号直到不冲突。 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken)
  if (!set.has(base)) return base
  let index = 2
  while (set.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

/** 由标题生成不冲突的 slug。 */
export function slugFromTitle(title: string, taken: Iterable<string>): string {
  return uniqueSlug(toSlug(title), taken)
}
