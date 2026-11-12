'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Field, Input } from '@blog/ui'

const SIZE_PRESETS = [
  { id: '1080x1440', label: '1080 × 1440（3:4）', width: 1080, height: 1440 },
  { id: '1242x1660', label: '1242 × 1660（小红书封面）', width: 1242, height: 1660 },
  { id: '1080x1080', label: '1080 × 1080（方形）', width: 1080, height: 1080 },
  { id: '1080x1920', label: '1080 × 1920（9:16）', width: 1080, height: 1920 },
] as const

const FONTS = [
  { label: '系统无衬线', value: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '思源宋体', value: "'Noto Serif SC', 'Songti SC', Georgia, serif" },
  { label: '黑体', value: "'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '等宽', value: "'SFMono-Regular', Menlo, Consolas, monospace" },
]

type LayerType = 'text' | 'image'

interface BaseLayer {
  id: string
  type: LayerType
  x: number
  y: number
  width: number
  height: number
}

interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  italic: boolean
  underline: boolean
  textShadow: string
  gradient: string | null
}

interface ImageLayer extends BaseLayer {
  type: 'image'
  src: string
  objectFit: 'cover' | 'contain'
  borderRadius: number
  opacity: number
}

type Layer = TextLayer | ImageLayer

type BackgroundType = 'solid' | 'gradient' | 'image'

interface Background {
  type: BackgroundType
  color: string
  gradient: { from: string; to: string; angle: number }
  image: string | null
}

interface CanvasState {
  width: number
  height: number
  background: Background
  layers: Layer[]
}

const DEFAULT_BG: Background = {
  type: 'gradient',
  color: '#7367f0',
  gradient: { from: '#ff6b9d', to: '#7367f0', angle: 135 },
  image: null,
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 直接解码 base64 data URL；不能用 fetch，CSP connect-src 不允许 data: 协议。 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta?.match(/data:([^;]+)/)?.[1] ?? 'image/png'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function createTextLayer(canvas: { width: number; height: number }, text: string): TextLayer {
  return {
    id: uid(),
    type: 'text',
    x: Math.round(canvas.width * 0.12),
    y: Math.round(canvas.height * 0.4),
    width: Math.round(canvas.width * 0.76),
    height: 120,
    text,
    fontFamily: FONTS[0]!.value,
    fontSize: 72,
    fontWeight: 800,
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 1.25,
    letterSpacing: 0,
    italic: false,
    underline: false,
    textShadow: '0 4px 20px rgba(0,0,0,0.25)',
    gradient: null,
  }
}

function createImageLayer(canvas: { width: number; height: number }, src: string, naturalW: number, naturalH: number): ImageLayer {
  const maxW = canvas.width * 0.8
  const ratio = naturalH / naturalW
  const width = Math.min(naturalW, maxW)
  const height = width * ratio
  return {
    id: uid(),
    type: 'image',
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
    src,
    objectFit: 'cover',
    borderRadius: 16,
    opacity: 1,
  }
}

const HANDLE_SIZE = 14

type DragMode =
  | { kind: 'none' }
  | { kind: 'move'; id: string; offsetX: number; offsetY: number }
  | { kind: 'resize'; id: string; handle: string; start: { x: number; y: number; w: number; h: number }; ratio: number }

export default function CoverToolPage() {
  const [presetId, setPresetId] = useState('1080x1440')
  const preset = SIZE_PRESETS.find((p) => p.id === presetId) ?? SIZE_PRESETS[0]
  const [state, setState] = useState<CanvasState>({
    width: preset.width,
    height: preset.height,
    background: DEFAULT_BG,
    layers: [],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragMode>({ kind: 'none' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)

  // 自适应缩放：根据容器宽度计算 scale
  useEffect(() => {
    function recalc() {
      const stage = stageRef.current
      if (!stage) return
      const available = stage.clientWidth - 32
      const s = Math.min(1, available / state.width)
      setScale(s)
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [state.width, state.height])

  const selected = useMemo(() => state.layers.find((l) => l.id === selectedId) ?? null, [state.layers, selectedId])

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
    }))
  }, [])

  const removeLayer = useCallback((id: string) => {
    setState((prev) => ({ ...prev, layers: prev.layers.filter((l) => l.id !== id) }))
    setSelectedId((cur) => (cur === id ? null : cur))
  }, [])

  function addText() {
    const layer = createTextLayer(state, '双击编辑标题')
    setState((prev) => ({ ...prev, layers: [...prev.layers, layer] }))
    setSelectedId(layer.id)
  }

  function addImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () => {
        const layer = createImageLayer(state, src, img.naturalWidth, img.naturalHeight)
        setState((prev) => ({ ...prev, layers: [...prev.layers, layer] }))
        setSelectedId(layer.id)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function setBackgroundImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      setState((prev) => ({ ...prev, background: { ...prev.background, type: 'image', image: reader.result as string } }))
    }
    reader.readAsDataURL(file)
  }

  // 键盘删除
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        removeLayer(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, editingId, removeLayer])

  // 拖拽 / 缩放
  function stageCoords(e: React.PointerEvent) {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const rect = stage.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  function onLayerPointerDown(e: React.PointerEvent, id: string) {
    if (editingId) return
    e.stopPropagation()
    setSelectedId(id)
    const layer = state.layers.find((l) => l.id === id)
    if (!layer) return
    const { x, y } = stageCoords(e)
    setDrag({ kind: 'move', id, offsetX: x - layer.x, offsetY: y - layer.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onHandlePointerDown(e: React.PointerEvent, id: string, handle: string) {
    e.stopPropagation()
    const layer = state.layers.find((l) => l.id === id)
    if (!layer) return
    const { x, y } = stageCoords(e)
    setDrag({
      kind: 'resize',
      id,
      handle,
      start: { x: layer.x, y: layer.y, w: layer.width, h: layer.height },
      ratio: layer.width / layer.height,
    })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (drag.kind === 'none') return
    const { x, y } = stageCoords(e)
    if (drag.kind === 'move') {
      updateLayer(drag.id, { x: Math.round(x - drag.offsetX), y: Math.round(y - drag.offsetY) })
    } else if (drag.kind === 'resize') {
      const dx = x - drag.start.x
      const dy = y - drag.start.y
      let { x: nx, y: ny, w: nw, h: nh } = drag.start
      const layer = state.layers.find((l) => l.id === drag.id)
      const keepRatio = layer?.type === 'image'
      if (drag.handle.includes('e')) nw = Math.max(20, drag.start.w + dx)
      if (drag.handle.includes('s')) nh = Math.max(20, drag.start.h + dy)
      if (drag.handle.includes('w')) {
        nw = Math.max(20, drag.start.w - dx)
        nx = drag.start.x + (drag.start.w - nw)
      }
      if (drag.handle.includes('n')) {
        nh = Math.max(20, drag.start.h - dy)
        ny = drag.start.y + (drag.start.h - nh)
      }
      if (keepRatio) {
        if (drag.handle === 'e' || drag.handle === 'w') nh = nw / drag.ratio
        else nw = nh * drag.ratio
      }
      updateLayer(drag.id, { x: Math.round(nx), y: Math.round(ny), width: Math.round(nw), height: Math.round(nh) })
    }
  }

  function onPointerUp() {
    setDrag({ kind: 'none' })
  }

  function bgCss(bg: Background): string {
    if (bg.type === 'solid') return bg.color
    if (bg.type === 'gradient') return `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
    return bg.image ? `url(${bg.image}) center/cover no-repeat` : bg.color
  }

  async function handleExport() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      // 构建离屏导出节点：截图节点本身不能用 fixed/负偏移，否则克隆后会被画到画布外
      const holder = document.createElement('div')
      holder.style.cssText = 'position:fixed;top:0;left:-20000px;pointer-events:none;'
      const exportNode = document.createElement('div')
      exportNode.style.cssText = [
        `width:${state.width}px`,
        `height:${state.height}px`,
        `background:${bgCss(state.background)}`,
        'overflow:hidden',
      ].join(';')

      for (const layer of state.layers) {
        if (layer.type === 'image') {
          const img = document.createElement('img')
          img.src = layer.src
          img.style.cssText = [
            'position:absolute',
            `left:${layer.x}px`,
            `top:${layer.y}px`,
            `width:${layer.width}px`,
            `height:${layer.height}px`,
            `object-fit:${layer.objectFit}`,
            `border-radius:${layer.borderRadius}px`,
            `opacity:${layer.opacity}`,
          ].join(';')
          exportNode.appendChild(img)
        } else {
          const div = document.createElement('div')
          div.textContent = layer.text
          const bg = layer.gradient ? `background:linear-gradient(${layer.gradient});-webkit-background-clip:text;background-clip:text;color:transparent;` : `color:${layer.color};`
          div.style.cssText = [
            'position:absolute',
            `left:${layer.x}px`,
            `top:${layer.y}px`,
            `width:${layer.width}px`,
            `min-height:${layer.height}px`,
            `font-family:${layer.fontFamily}`,
            `font-size:${layer.fontSize}px`,
            `font-weight:${layer.fontWeight}`,
            `text-align:${layer.textAlign}`,
            `line-height:${layer.lineHeight}`,
            `letter-spacing:${layer.letterSpacing}px`,
            layer.italic ? 'font-style:italic' : '',
            layer.underline ? 'text-decoration:underline' : '',
            layer.textShadow ? `text-shadow:${layer.textShadow}` : '',
            bg,
            'white-space:pre-wrap',
            'word-break:break-word',
          ].join(';')
          exportNode.appendChild(div)
        }
      }

      document.body.appendChild(holder)
      holder.appendChild(exportNode)
      try {
        const images = Array.from(exportNode.querySelectorAll('img'))
        await Promise.all(images.map((img) => (img.complete ? img.decode().catch(() => null) : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r() }))))
        const { toPng, toJpeg } = await import('html-to-image')
        const dataUrl = exportFormat === 'png'
          ? await toPng(exportNode, { pixelRatio: 1, width: state.width, height: state.height, cacheBust: true })
          : await toJpeg(exportNode, { pixelRatio: 1, width: state.width, height: state.height, quality: 0.95, cacheBust: true })
        const blob = dataUrlToBlob(dataUrl)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `cover-${state.width}x${state.height}.${exportFormat}`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        setNotice(`已导出封面（${state.width} × ${state.height}）。`)
      } finally {
        holder.remove()
      }
    } catch (cause) {
      console.error('[cover export]', cause)
      setError(cause instanceof Error ? cause.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  const layerFileRef = useRef<HTMLInputElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">封面设计</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">画布式排版：文字、图片、背景自由摆放，一键导出小红书封面。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            value={presetId}
            onChange={(e) => {
              setPresetId(e.target.value)
              const p = SIZE_PRESETS.find((s) => s.id === e.target.value) ?? SIZE_PRESETS[0]
              setState((prev) => ({ ...prev, width: p.width, height: p.height }))
            }}
          >
            {SIZE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg')}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
          </select>
          <Button variant="primary" onClick={() => void handleExport()} loading={busy} disabled={state.layers.length === 0}>
            导出封面
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-xs text-[var(--color-text-muted)]">{notice}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 画布区 */}
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={addText}>＋ 文字</Button>
            <Button variant="secondary" size="sm" onClick={() => layerFileRef.current?.click()}>＋ 图片</Button>
            <input ref={layerFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = '' }} />
            <span className="mx-1 h-6 w-px self-center bg-[var(--color-border)]" />
            <select
              className="h-8 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"
              value={state.background.type}
              onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, type: e.target.value as BackgroundType } }))}
            >
              <option value="solid">纯色背景</option>
              <option value="gradient">渐变背景</option>
              <option value="image">图片背景</option>
            </select>
            {state.background.type === 'image' ? (
              <Button variant="secondary" size="sm" onClick={() => bgFileRef.current?.click()}>上传背景图</Button>
            ) : null}
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setBackgroundImage(f); e.target.value = '' }} />
            {selectedId ? (
              <Button variant="ghost" size="sm" onClick={() => removeLayer(selectedId)}>删除选中</Button>
            ) : null}
          </div>

          <div ref={stageRef} className="flex items-start justify-center overflow-auto rounded-[var(--radius)] bg-[var(--color-surface-muted)] p-4">
            <div
              className="relative"
              style={{ width: state.width * scale, height: state.height * scale }}
            >
              <div
                className="absolute select-none"
                style={{
                  width: state.width,
                  height: state.height,
                  background: bgCss(state.background),
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                }}
                onPointerDown={() => setSelectedId(null)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {state.layers.map((layer) => {
                  const isSelected = layer.id === selectedId
                  const isEditing = layer.id === editingId
                  if (layer.type === 'image') {
                    return (
                      <div
                        key={layer.id}
                        className="absolute"
                        style={{
                          left: layer.x,
                          top: layer.y,
                          width: layer.width,
                          height: layer.height,
                          outline: isSelected ? '2px dashed #3b6cf0' : 'none',
                          cursor: 'move',
                        }}
                        onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
                      >
                        <img src={layer.src} alt="" style={{ width: '100%', height: '100%', objectFit: layer.objectFit, borderRadius: layer.borderRadius, opacity: layer.opacity, pointerEvents: 'none' }} draggable={false} />
                        {isSelected ? <ResizeHandles onHandleDown={(e, h) => onHandlePointerDown(e, layer.id, h)} /> : null}
                      </div>
                    )
                  }
                  return (
                    <div
                      key={layer.id}
                      className="absolute"
                      style={{
                        left: layer.x,
                        top: layer.y,
                        width: layer.width,
                        minHeight: layer.height,
                        outline: isSelected ? '2px dashed #3b6cf0' : 'none',
                        cursor: 'move',
                      }}
                      onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingId(layer.id) }}
                    >
                      <div
                        style={{
                          fontFamily: layer.fontFamily,
                          fontSize: layer.fontSize,
                          fontWeight: layer.fontWeight,
                          color: layer.color,
                          textAlign: layer.textAlign,
                          lineHeight: layer.lineHeight,
                          letterSpacing: `${layer.letterSpacing}px`,
                          fontStyle: layer.italic ? 'italic' : 'normal',
                          textDecoration: layer.underline ? 'underline' : 'none',
                          textShadow: layer.textShadow,
                          background: layer.gradient ? `linear-gradient(${layer.gradient})` : undefined,
                          WebkitBackgroundClip: layer.gradient ? 'text' : undefined,
                          backgroundClip: layer.gradient ? 'text' : undefined,
                          WebkitTextFillColor: layer.gradient ? 'transparent' : undefined,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          updateLayer(layer.id, { text: e.currentTarget.textContent ?? '' })
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {layer.text}
                      </div>
                      {isSelected ? <ResizeHandles onHandleDown={(e, h) => onHandlePointerDown(e, layer.id, h)} /> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-subtle)]">提示：点击选中图层，拖拽移动，拖角点缩放；双击文字可编辑内容，Delete 键删除。</p>
        </Card>

        {/* 属性面板 */}
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">背景</h2>
          {state.background.type === 'solid' ? (
            <div className="flex items-center gap-2">
              <input type="color" value={state.background.color} onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, color: e.target.value } }))} className="h-9 w-12 rounded border border-[var(--color-border)]" />
              <Input value={state.background.color} onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, color: e.target.value } }))} />
            </div>
          ) : null}
          {state.background.type === 'gradient' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input type="color" value={state.background.gradient.from} onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, from: e.target.value } } }))} className="h-9 w-12 rounded border border-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-text-subtle)]">→</span>
                <input type="color" value={state.background.gradient.to} onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, to: e.target.value } } }))} className="h-9 w-12 rounded border border-[var(--color-border)]" />
              </div>
              <Field label={`角度 ${state.background.gradient.angle}°`}>
                <input type="range" min={0} max={360} value={state.background.gradient.angle} onChange={(e) => setState((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, angle: Number(e.target.value) } } }))} className="w-full" />
              </Field>
            </div>
          ) : null}
          {state.background.type === 'image' ? (
            <p className="text-xs text-[var(--color-text-subtle)]">已上传背景图；点击上方「上传背景图」可替换。</p>
          ) : null}

          <div className="my-1 h-px bg-[var(--color-border)]" />

          <h2 className="text-sm font-semibold">{selected ? '选中图层属性' : '未选中图层'}</h2>
          {!selected ? (
            <p className="text-xs text-[var(--color-text-subtle)]">点击画布中的文字或图片以编辑属性。</p>
          ) : selected.type === 'text' ? (
            <div className="flex flex-col gap-3">
              <Field label="文字内容">
                <textarea
                  value={selected.text}
                  onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                  rows={3}
                  className="w-full resize-y rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </Field>
              <Field label="字体">
                <select className="h-10 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" value={selected.fontFamily} onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value })}>
                  {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`字号 ${selected.fontSize}`}>
                  <input type="range" min={12} max={200} value={selected.fontSize} onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) })} className="w-full" />
                </Field>
                <Field label={`字重 ${selected.fontWeight}`}>
                  <select className="h-10 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" value={selected.fontWeight} onChange={(e) => updateLayer(selected.id, { fontWeight: Number(e.target.value) })}>
                    {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="颜色">
                  <input type="color" value={selected.color} onChange={(e) => updateLayer(selected.id, { color: e.target.value })} className="h-10 w-full rounded border border-[var(--color-border)]" />
                </Field>
                <Field label="对齐">
                  <div className="flex h-10 overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)]">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button key={a} type="button" onClick={() => updateLayer(selected.id, { textAlign: a })} className={`flex-1 text-xs ${selected.textAlign === a ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)]'}`}>{a === 'left' ? '左' : a === 'center' ? '中' : '右'}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`行高 ${selected.lineHeight}`}>
                  <input type="range" min={1} max={2.5} step={0.05} value={selected.lineHeight} onChange={(e) => updateLayer(selected.id, { lineHeight: Number(e.target.value) })} className="w-full" />
                </Field>
                <Field label={`字间距 ${selected.letterSpacing}`}>
                  <input type="range" min={-5} max={20} value={selected.letterSpacing} onChange={(e) => updateLayer(selected.id, { letterSpacing: Number(e.target.value) })} className="w-full" />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={selected.italic ? 'primary' : 'secondary'} size="sm" onClick={() => updateLayer(selected.id, { italic: !selected.italic })}>斜体</Button>
                <Button variant={selected.underline ? 'primary' : 'secondary'} size="sm" onClick={() => updateLayer(selected.id, { underline: !selected.underline })}>下划线</Button>
                <Button variant={selected.textShadow ? 'primary' : 'secondary'} size="sm" onClick={() => updateLayer(selected.id, { textShadow: selected.textShadow ? '' : '0 4px 20px rgba(0,0,0,0.25)' })}>阴影</Button>
              </div>
              <Field label="渐变文字（留空用纯色）">
                <Input value={selected.gradient ?? ''} onChange={(e) => updateLayer(selected.id, { gradient: e.target.value || null })} placeholder="例如 135deg, #fff, #ffd6e7" />
              </Field>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Field label="填充方式">
                <select className="h-10 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm" value={selected.objectFit} onChange={(e) => updateLayer(selected.id, { objectFit: e.target.value as 'cover' | 'contain' })}>
                  <option value="cover">填充（cover）</option>
                  <option value="contain">适应（contain）</option>
                </select>
              </Field>
              <Field label={`圆角 ${selected.borderRadius}`}>
                <input type="range" min={0} max={80} value={selected.borderRadius} onChange={(e) => updateLayer(selected.id, { borderRadius: Number(e.target.value) })} className="w-full" />
              </Field>
              <Field label={`透明度 ${Math.round(selected.opacity * 100)}%`}>
                <input type="range" min={0.1} max={1} step={0.05} value={selected.opacity} onChange={(e) => updateLayer(selected.id, { opacity: Number(e.target.value) })} className="w-full" />
              </Field>
            </div>
          )}

          {selected ? (
            <>
              <div className="my-1 h-px bg-[var(--color-border)]" />
              <h2 className="text-sm font-semibold">位置与尺寸</h2>
              <div className="grid grid-cols-2 gap-2">
                <Field label="X"><Input type="number" value={Math.round(selected.x)} onChange={(e) => updateLayer(selected.id, { x: Number(e.target.value) })} /></Field>
                <Field label="Y"><Input type="number" value={Math.round(selected.y)} onChange={(e) => updateLayer(selected.id, { y: Number(e.target.value) })} /></Field>
                <Field label="宽"><Input type="number" value={Math.round(selected.width)} onChange={(e) => updateLayer(selected.id, { width: Number(e.target.value) })} /></Field>
                <Field label="高"><Input type="number" value={Math.round(selected.height)} onChange={(e) => updateLayer(selected.id, { height: Number(e.target.value) })} /></Field>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

function ResizeHandles({ onHandleDown }: { onHandleDown: (e: React.PointerEvent, handle: string) => void }) {
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
  const pos: Record<string, React.CSSProperties> = {
    nw: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
    n: { top: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2, cursor: 'ns-resize' },
    ne: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
    e: { top: '50%', right: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2, cursor: 'ew-resize' },
    se: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
    s: { bottom: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2, cursor: 'ns-resize' },
    sw: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
    w: { top: '50%', left: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2, cursor: 'ew-resize' },
  }
  return (
    <>
      {handles.map((h) => (
        <div
          key={h}
          onPointerDown={(e) => onHandleDown(e, h)}
          style={{
            position: 'absolute',
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: '#fff',
            border: '2px solid #3b6cf0',
            borderRadius: 3,
            zIndex: 10,
            ...pos[h],
          }}
        />
      ))}
    </>
  )
}
