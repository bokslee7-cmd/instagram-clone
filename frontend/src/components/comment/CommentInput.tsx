import { useState } from 'react'
import { SmilePlus } from 'lucide-react'

interface CommentInputProps {
  onSubmit: (content: string) => void
  isSubmitting?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function CommentInput({ onSubmit, isSubmitting, placeholder = '댓글 달기...', autoFocus }: CommentInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isSubmitting) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-neutral-200 px-4 py-3">
      <SmilePlus size={22} className="text-neutral-500 shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="댓글 입력"
        className="flex-1 text-sm outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        disabled={!value.trim() || isSubmitting}
        className="text-sm font-semibold text-sky-500 disabled:text-sky-200"
      >
        게시
      </button>
    </form>
  )
}
