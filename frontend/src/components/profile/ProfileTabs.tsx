import { Bookmark, Grid3x3 } from 'lucide-react'
import clsx from 'clsx'

export type ProfileTab = 'posts' | 'saved'

interface ProfileTabsProps {
  active: ProfileTab
  onChange: (tab: ProfileTab) => void
  showSaved: boolean
}

export function ProfileTabs({ active, onChange, showSaved }: ProfileTabsProps) {
  return (
    <div className="flex justify-center border-t border-neutral-200">
      <button
        onClick={() => onChange('posts')}
        className={clsx(
          'flex items-center gap-1.5 px-8 py-3 text-xs font-semibold tracking-wide uppercase border-t -mt-px',
          active === 'posts' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400',
        )}
      >
        <Grid3x3 size={14} /> 게시물
      </button>
      {showSaved && (
        <button
          onClick={() => onChange('saved')}
          className={clsx(
            'flex items-center gap-1.5 px-8 py-3 text-xs font-semibold tracking-wide uppercase border-t -mt-px',
            active === 'saved' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400',
          )}
        >
          <Bookmark size={14} /> 저장됨
        </button>
      )}
    </div>
  )
}
