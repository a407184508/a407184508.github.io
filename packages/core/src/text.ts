export interface SensitiveFinding {
  label: string
  sample: string
}

const RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: '手机号', pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
  { label: '身份证号', pattern: /(?<!\d)\d{17}[\dXx](?!\d)/g },
  { label: '银行卡号', pattern: /(?<!\d)\d{16,19}(?!\d)/g },
  { label: '邮箱', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
]

const ADDRESS_KEYWORDS = ['小区', '号楼', '单元', '室', '街道', '门牌']

function mask(sample: string): string {
  if (sample.length <= 4) return '***'
  return `${sample.slice(0, 2)}****${sample.slice(-2)}`
}

/**
 * 发布前的敏感信息提醒：只提醒、不阻断。
 */
export function detectSensitive(text: string): SensitiveFinding[] {
  const findings: SensitiveFinding[] = []
  for (const rule of RULES) {
    const matches = text.match(rule.pattern)
    if (!matches) continue
    for (const sample of new Set(matches)) {
      findings.push({ label: rule.label, sample: mask(sample) })
    }
  }
  const addressHit = ADDRESS_KEYWORDS.find((keyword) => text.includes(keyword))
  if (addressHit) {
    findings.push({ label: '可能的详细地址', sample: `包含“${addressHit}”` })
  }
  return findings.slice(0, 8)
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(markdown: string, max = 120): string {
  const text = stripMarkdown(markdown)
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}
