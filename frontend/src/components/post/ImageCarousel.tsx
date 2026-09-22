import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import clsx from 'clsx'
import type { PostImage } from '../../types'

interface ImageCarouselProps {
  images: PostImage[]
  alt: string
  onDoubleClick?: () => void
  className?: string
  fillHeight?: boolean
}

export function ImageCarousel({ images, alt, onDoubleClick, className, fillHeight }: ImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
  const hasMultiple = sorted.length > 1

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(sorted.length - 1, next)))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) goTo(index - 1)
    else if (delta < -50) goTo(index + 1)
    touchStartX.current = null
  }

  return (
    <div
      className={clsx(
        'relative w-full bg-black overflow-hidden select-none',
        fillHeight ? 'h-full' : 'aspect-square',
        className,
      )}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={onDoubleClick}
      >
        {sorted.map((img, i) => (
          <img
            key={img.id}
            src={img.image_url}
            alt={`${alt} ${i + 1}`}
            loading="lazy"
            className="w-full h-full flex-shrink-0 object-cover"
            draggable={false}
          />
        ))}
      </div>

      {hasMultiple && index > 0 && (
        <button
          aria-label="이전 이미지"
          onClick={() => goTo(index - 1)}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {hasMultiple && index < sorted.length - 1 && (
        <button
          aria-label="다음 이미지"
          onClick={() => goTo(index + 1)}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {hasMultiple && (
        <>
          <div className="absolute top-3 right-3 text-xs font-medium text-white bg-black/50 rounded-full px-2 py-0.5">
            {index + 1}/{sorted.length}
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sorted.map((_, i) => (
              <span
                key={i}
                className={clsx('w-1.5 h-1.5 rounded-full', i === index ? 'bg-sky-500' : 'bg-white/70')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
