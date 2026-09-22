import { Heart } from 'lucide-react'
import clsx from 'clsx'

export function DoubleTapHeart({ show }: { show: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Heart
        size={90}
        strokeWidth={0}
        fill="white"
        className={clsx('drop-shadow-lg transition-all duration-300', show ? 'opacity-90 scale-100' : 'opacity-0 scale-50')}
      />
    </div>
  )
}
