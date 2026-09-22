import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import * as postsApi from '../../api/posts'
import { Avatar } from '../common/Avatar'
import { ImageCarousel } from './ImageCarousel'
import { DoubleTapHeart } from './DoubleTapHeart'
import { CaptionText } from './CaptionText'
import { PostOptionsMenu } from './PostOptionsMenu'
import { useLikePost } from '../../hooks/useLikePost'
import { useSavePost } from '../../hooks/useSavePost'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useAuthStore } from '../../store/authStore'
import { formatRelativeTime } from '../../utils/time'
import type { Post } from '../../types'

export function PostCard({ post }: { post: Post }) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const { toggleLike } = useLikePost()
  const { toggleSave } = useSavePost()
  const { requireAuth } = useRequireAuth()
  const [showHeart, setShowHeart] = useState(false)
  const isOwner = currentUser?.id === post.author.id

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const handleDoubleClick = () => {
    requireAuth(() => {
      if (!post.is_liked) toggleLike(post)
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 700)
    })
  }

  return (
    <article className="bg-white border border-neutral-200 rounded-md mb-4 max-w-[470px] w-full mx-auto sm:mx-0">
      <header className="flex items-center justify-between px-3 py-2.5">
        <Link to={`/${post.author.username}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={post.author.avatar_url} alt={post.author.username} size="sm" />
          <div className="min-w-0">
            <span className="text-sm font-semibold truncate block">{post.author.username}</span>
          </div>
          {post.location && <span className="text-xs text-neutral-500 hidden sm:inline">· {post.location}</span>}
        </Link>
        <PostOptionsMenu isOwner={isOwner} postId={post.id} onDelete={() => deleteMutation.mutate()} />
      </header>

      <div className="relative">
        <ImageCarousel
          images={post.images}
          alt={post.caption ?? `${post.author.username}의 게시물`}
          onDoubleClick={handleDoubleClick}
        />
        <DoubleTapHeart show={showHeart} />
      </div>

      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button aria-label="좋아요" onClick={() => requireAuth(() => toggleLike(post))} className="hover:opacity-60">
              <Heart
                size={24}
                className={clsx(post.is_liked ? 'fill-red-500 text-red-500' : 'text-neutral-900')}
              />
            </button>
            <Link
              to={`/p/${post.id}`}
              state={{ background: location }}
              aria-label="댓글"
              className="hover:opacity-60"
            >
              <MessageCircle size={24} />
            </Link>
            <button aria-label="공유" className="hover:opacity-60">
              <Send size={24} />
            </button>
          </div>
          <button aria-label="저장" onClick={() => requireAuth(() => toggleSave(post))} className="hover:opacity-60">
            <Bookmark size={24} className={clsx(post.is_saved && 'fill-neutral-900')} />
          </button>
        </div>

        <p className="text-sm font-semibold mt-2">좋아요 {post.like_count.toLocaleString()}개</p>

        {post.caption && (
          <div className="mt-1">
            <CaptionText username={post.author.username} caption={post.caption} />
          </div>
        )}

        {post.comment_count > 0 && (
          <Link
            to={`/p/${post.id}`}
            state={{ background: location }}
            className="block text-sm text-neutral-500 mt-1"
          >
            댓글 {post.comment_count}개 모두 보기
          </Link>
        )}

        <p className="text-[11px] text-neutral-400 uppercase mt-2 tracking-wide">
          {formatRelativeTime(post.created_at)}
        </p>
      </div>
    </article>
  )
}
