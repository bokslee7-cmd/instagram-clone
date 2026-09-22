import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

interface PostOptionsMenuProps {
  isOwner: boolean
  postId: number
  onDelete: () => void
}

export function PostOptionsMenu({ isOwner, postId, onDelete }: PostOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleDelete = () => {
    setIsOpen(false)
    if (window.confirm('게시물을 삭제할까요?')) {
      onDelete()
    }
  }

  const handleCopyLink = async () => {
    setIsOpen(false)
    const url = `${window.location.origin}/p/${postId}`
    try {
      await navigator.clipboard.writeText(url)
      window.alert('링크가 복사되었습니다.')
    } catch {
      window.prompt('아래 링크를 복사하세요.', url)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button aria-label="더보기" className="p-1 hover:opacity-60" onClick={() => setIsOpen((open) => !open)}>
        <MoreHorizontal size={20} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20">
          {isOwner && (
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-100"
            >
              삭제
            </button>
          )}
          <button onClick={handleCopyLink} className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100">
            링크 복사
          </button>
        </div>
      )}
    </div>
  )
}
