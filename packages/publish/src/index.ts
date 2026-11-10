import { sha256Hex } from '@blog/core'

export interface FingerprintInput {
  markdown: string
  imageHashes: string[]
}

/** 发布内容指纹：正文 + 图片哈希列表，用于“有未发布修改”判断。 */
export async function fingerprintArticle(input: FingerprintInput): Promise<string> {
  const sorted = [...input.imageHashes].sort()
  return sha256Hex(`${input.markdown}\n--images--\n${sorted.join('\n')}`)
}

export * from './http'
export * from './client'
