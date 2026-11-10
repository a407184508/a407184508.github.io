import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutosaveOptions<T> {
  value: T
  onSave: (value: T) => Promise<void>
  delay?: number
  maxDelay?: number
  enabled?: boolean
}

export interface UseAutosaveResult {
  state: SaveState
  error: string | null
  lastSavedAt: string | null
  flush: () => Promise<void>
}

/**
 * 自动保存：停止输入 2 秒写入，最长 5 秒强制写入；
 * 页面隐藏/离开时同步 flush。
 */
export function useAutosave<T>({
  value,
  onSave,
  delay = 2000,
  maxDelay = 5000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [state, setState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const valueRef = useRef(value)
  const savedRef = useRef(value)
  const onSaveRef = useRef(onSave)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  valueRef.current = value
  onSaveRef.current = onSave

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    timerRef.current = null
    maxTimerRef.current = null
  }

  const flush = useCallback(async () => {
    clearTimers()
    if (!enabled || savingRef.current) return
    const next = valueRef.current
    if (Object.is(next, savedRef.current)) return
    savingRef.current = true
    setState('saving')
    setError(null)
    try {
      await onSaveRef.current(next)
      savedRef.current = next
      setState('saved')
      setLastSavedAt(new Date().toISOString())
    } catch (cause) {
      setState('error')
      setError(cause instanceof Error ? cause.message : '保存失败')
    } finally {
      savingRef.current = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    if (Object.is(value, savedRef.current)) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void flush()
    }, delay)
    if (!maxTimerRef.current) {
      maxTimerRef.current = setTimeout(() => {
        void flush()
      }, maxDelay)
    }
  }, [value, enabled, delay, maxDelay, flush])

  useEffect(() => {
    const handleHide = () => {
      void flush()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    window.addEventListener('pagehide', handleHide)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('pagehide', handleHide)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearTimers()
    }
  }, [flush])

  return { state, error, lastSavedAt, flush }
}
