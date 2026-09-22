import { useCallback, useRef } from 'react'

interface Options {
  hasMore: boolean
  onLoadMore: () => void
  disabled?: boolean
}

export function useInfiniteScroll({ hasMore, onLoadMore, disabled }: Options) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (disabled) return
      observerRef.current?.disconnect()

      if (node) {
        observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) {
            onLoadMore()
          }
        })
        observerRef.current.observe(node)
      }
    },
    [hasMore, onLoadMore, disabled],
  )

  return sentinelRef
}
