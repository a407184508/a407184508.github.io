import { useCallback, useEffect, useRef, useState } from 'react'

export type LockStatus = 'acquiring' | 'owner' | 'readonly'

interface LockMessage {
  type: 'claim' | 'held' | 'release' | 'takeover'
  tabId: string
  target?: string
}

/**
 * 同一篇文章的多标签页互斥：后打开者只读，可主动“接管”。
 * 通过 BroadcastChannel 通信；关闭页面时释放。
 */
export function useEditLock(articleId: string): { status: LockStatus; takeover: () => void } {
  const [status, setStatus] = useState<LockStatus>('acquiring')
  const tabIdRef = useRef<string>(crypto.randomUUID())
  const ownedRef = useRef(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    ownedRef.current = false
    setStatus('acquiring')
    if (typeof BroadcastChannel === 'undefined') {
      ownedRef.current = true
      setStatus('owner')
      return
    }

    const channel = new BroadcastChannel(`blog-studio:edit-lock:${articleId}`)
    channelRef.current = channel
    const tabId = tabIdRef.current

    const settleTimer = setTimeout(() => {
      if (!ownedRef.current) {
        ownedRef.current = true
        setStatus('owner')
      }
    }, 180)

    const handleMessage = (event: MessageEvent<LockMessage>) => {
      const message = event.data
      if (!message || message.tabId === tabId) return
      if (message.type === 'claim' && ownedRef.current) {
        channel.postMessage({ type: 'held', tabId, target: message.tabId } satisfies LockMessage)
      }
      if (message.type === 'held' && message.target === tabId) {
        clearTimeout(settleTimer)
        setStatus('readonly')
      }
      if (message.type === 'takeover' && message.target === tabId) {
        ownedRef.current = false
        setStatus('readonly')
      }
    }

    channel.addEventListener('message', handleMessage)
    channel.postMessage({ type: 'claim', tabId } satisfies LockMessage)

    const handleUnload = () => {
      if (ownedRef.current) channel.postMessage({ type: 'release', tabId } satisfies LockMessage)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearTimeout(settleTimer)
      window.removeEventListener('beforeunload', handleUnload)
      if (ownedRef.current) channel.postMessage({ type: 'release', tabId } satisfies LockMessage)
      channel.removeEventListener('message', handleMessage)
      channel.close()
      channelRef.current = null
    }
  }, [articleId])

  const takeover = useCallback(() => {
    const channel = channelRef.current
    if (!channel) return
    channel.postMessage({ type: 'takeover', tabId: tabIdRef.current } satisfies LockMessage)
    ownedRef.current = true
    setStatus('owner')
  }, [])

  return { status, takeover }
}
