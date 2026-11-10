import { useEffect, useState } from 'react'
import { sha256Hex, type Asset } from '@blog/core'
import { getDb } from './db'

async function readDimensions(blob: Blob): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap !== 'function') return {}
  try {
    const bitmap = await createImageBitmap(blob)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return {}
  }
}

export async function saveAsset(input: Blob): Promise<Asset> {
  const bytes = new Uint8Array(await input.arrayBuffer())
  const id = await sha256Hex(bytes)
  const db = getDb()
  const existing = await db.assets.get(id)
  if (existing) return existing
  const dimensions = await readDimensions(input)
  const asset: Asset = {
    id,
    blob: input,
    mime: input.type || 'application/octet-stream',
    width: dimensions.width,
    height: dimensions.height,
    size: input.size,
    createdAt: new Date().toISOString(),
  }
  await db.assets.put(asset)
  return asset
}

export async function getAsset(id: string): Promise<Asset | null> {
  return (await getDb().assets.get(id)) ?? null
}

/** 给定 asset id 集合，返回 id → object URL，并在卸载时释放。 */
export function useAssetUrls(ids: string[]): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map())
  const key = ids.join(',')

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    async function load() {
      const next = new Map<string, string>()
      for (const id of ids) {
        const asset = await getAsset(id)
        if (!asset) continue
        const url = URL.createObjectURL(asset.blob)
        created.push(url)
        next.set(id, url)
      }
      if (cancelled) {
        created.forEach((url) => URL.revokeObjectURL(url))
        return
      }
      setUrls(next)
    }
    void load()
    return () => {
      cancelled = true
      created.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

export interface CompressedImage {
  blob: Blob
  mime: string
  ext: string
  width: number
  height: number
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/svg+xml') return 'svg'
  return 'bin'
}

async function encodeCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(bitmap, 0, 0, width, height)
    return canvas.convertToBlob({ type: mime, quality })
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), mime, quality))
}

/** 发布前压缩：最长边 ≤ 2400，优先 WebP（PNG/GIF 保留原格式）。 */
export async function compressImage(blob: Blob, maxEdge = 2400, maxBytes = 2 * 1024 * 1024): Promise<CompressedImage> {
  if (typeof createImageBitmap !== 'function') {
    return { blob, mime: blob.type, ext: extFromMime(blob.type), width: 0, height: 0 }
  }
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const keepFormat = blob.type === 'image/png' || blob.type === 'image/gif' || blob.type === 'image/svg+xml'
  const mime = keepFormat ? blob.type : 'image/webp'

  let quality = 0.85
  let output = await encodeCanvas(bitmap, width, height, mime, quality)
  while (output && output.size > maxBytes && quality > 0.5) {
    quality -= 0.1
    output = await encodeCanvas(bitmap, width, height, mime, quality)
  }
  bitmap.close()

  if (!output) {
    return {
      blob,
      mime: blob.type,
      ext: extFromMime(blob.type),
      width,
      height,
    }
  }
  return { blob: output, mime, ext: extFromMime(mime), width, height }
}
