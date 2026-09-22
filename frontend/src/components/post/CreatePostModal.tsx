import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useUiStore } from '../../store/uiStore'
import * as postsApi from '../../api/posts'

interface DraftImage {
  file: File
  previewUrl: string
}

export function CreatePostModal() {
  const isOpen = useUiStore((s) => s.isCreatePostModalOpen)
  const close = useUiStore((s) => s.closeCreatePostModal)
  const queryClient = useQueryClient()

  const [images, setImages] = useState<DraftImage[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setImages([])
    setCaption('')
    setLocation('')
  }

  const handleClose = () => {
    reset()
    close()
  }

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const next = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...next])
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      postsApi.createPost({ caption, location, images: images.map((image) => image.file) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      handleClose()
    },
  })

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-lg overflow-hidden" showCloseButton={false}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <button onClick={handleClose} aria-label="닫기">
          <X size={20} />
        </button>
        <h2 className="font-semibold text-sm">새 게시물 만들기</h2>
        <button
          onClick={() => createMutation.mutate()}
          disabled={images.length === 0 || createMutation.isPending}
          className="text-sm font-semibold text-sky-500 disabled:text-sky-200"
        >
          {createMutation.isPending ? '게시 중...' : '공유하기'}
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {images.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`flex flex-col items-center justify-center gap-3 h-72 border-2 border-dashed m-4 rounded-lg transition-colors ${
              isDragging ? 'border-sky-400 bg-sky-50' : 'border-neutral-200'
            }`}
          >
            <ImagePlus size={48} className="text-neutral-300" />
            <p className="text-sm text-neutral-500">사진을 여기에 끌어다 놓으세요</p>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              컴퓨터에서 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <div key={img.previewUrl} className="relative shrink-0">
                  <img src={img.previewUrl} alt={`업로드 이미지 ${i + 1}`} className="w-24 h-24 object-cover rounded-md" />
                  <button
                    onClick={() => removeImage(i)}
                    aria-label="이미지 제거"
                    className="absolute -top-1.5 -right-1.5 bg-black/70 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 shrink-0 border border-dashed border-neutral-300 rounded-md flex items-center justify-center text-neutral-400"
              >
                <ImagePlus size={22} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={3}
              placeholder="문구 입력..."
              className="w-full resize-none text-sm outline-none border border-neutral-200 rounded-md p-2"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="위치 추가"
              className="w-full text-sm outline-none border border-neutral-200 rounded-md p-2"
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
