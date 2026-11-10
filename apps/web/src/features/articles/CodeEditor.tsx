'use client'

import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'

export interface CodeEditorProps {
  initialValue: string
  onChange: (value: string) => void
  readOnly?: boolean
  fontSize?: number
  lineWrapping?: boolean
  /** 粘贴/拖入图片时调用，返回要插入的 Markdown 片段 */
  onImageFiles?: (files: File[]) => Promise<string[]>
  onFlushShortcut?: () => void
}

function imageFilesFrom(data: DataTransfer | null): File[] {
  if (!data) return []
  return [...data.files].filter((file) => file.type.startsWith('image/'))
}

export function CodeEditor({
  initialValue,
  onChange,
  readOnly = false,
  fontSize = 15,
  lineWrapping = true,
  onImageFiles,
  onFlushShortcut,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const imageHandlerRef = useRef(onImageFiles)
  const flushRef = useRef(onFlushShortcut)
  onChangeRef.current = onChange
  imageHandlerRef.current = onImageFiles
  flushRef.current = onFlushShortcut

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const handleFiles = async (files: File[], view: EditorView) => {
      const handler = imageHandlerRef.current
      if (!handler || files.length === 0) return
      const snippets = await handler(files)
      if (snippets.length === 0) return
      const position = view.state.selection.main.head
      view.dispatch({ changes: { from: position, insert: snippets.join('\n') } })
      view.focus()
    }

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        basicSetup,
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': { fontSize: `${fontSize}px`, height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        ...(lineWrapping ? [EditorView.lineWrapping] : []),
        keymap.of([
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              flushRef.current?.()
              return true
            },
          },
        ]),
        EditorView.domEventHandlers({
          paste: (event, view) => {
            const files = imageFilesFrom(event.clipboardData)
            if (files.length === 0) return false
            event.preventDefault()
            void handleFiles(files, view)
            return true
          },
          drop: (event, view) => {
            const files = imageFilesFrom(event.dataTransfer)
            if (files.length === 0) return false
            event.preventDefault()
            void handleFiles(files, view)
            return true
          },
        }),
      ],
    })

    const view = new EditorView({ state, parent: host })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // 只挂载一次；外部重新加载时通过 key 重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, fontSize, lineWrapping])

  return <div ref={hostRef} className="h-full overflow-hidden" />
}
