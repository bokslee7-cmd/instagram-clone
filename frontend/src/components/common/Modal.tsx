import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function Modal({ isOpen, onClose, children, className, showCloseButton = true }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={clsx('relative bg-white rounded-xl shadow-2xl max-h-[90vh]', className)}>
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="닫기"
            className="absolute -top-10 right-0 text-white/90 hover:text-white md:top-3 md:right-3 md:text-neutral-500"
          >
            <X size={26} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
