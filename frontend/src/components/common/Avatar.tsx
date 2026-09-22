import clsx from 'clsx'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  className?: string
}

const SIZE_MAP: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-20 h-20',
  xl: 'w-36 h-36',
}

const FALLBACK = 'https://api.dicebear.com/9.x/initials/svg?seed=user&backgroundType=gradientLinear'

export function Avatar({ src, alt, size = 'md', ring, className }: AvatarProps) {
  return (
    <div
      className={clsx(
        'shrink-0 rounded-full overflow-hidden bg-neutral-100',
        SIZE_MAP[size],
        ring && 'ring-2 ring-offset-2 ring-pink-500',
        className,
      )}
    >
      <img
        src={src || FALLBACK}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = FALLBACK
        }}
      />
    </div>
  )
}
