import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import * as postsApi from '../../api/posts'
import { Avatar } from '../common/Avatar'
import { ImageCarousel } from './ImageCarousel'
import { CaptionText } from './CaptionText'
import { CommentList } from '../comment/CommentList'
import { PostOptionsMenu } from './PostOptionsMenu'
import { useLikePost } from '../../hooks/useLikePost'
import { useSavePost } from '../../hooks/useSavePost'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useAuthStore } from '../../store/authStore'
import { formatRelativeTime } from '../../utils/time'

export function PostDetailContent({ postId }: { postId: number }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.getPostById(postId),
  })
  const { toggleLike } = useLikePost()
  const { toggleSave } = useSavePost()
  const { requireAuth } = useRequireAuth()

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/')
    },
  })

  if (isLoading) {
    return <div className="w-full h-[70vh] flex items-center justify-center text-neutral-400">불러오는 중...</div>
  }

  if (!post) {
    return <div className="w-full h-[70vh] flex items-center justify-center text-neutral-400">게시물을 찾을 수 없습니다.</div>
  }

  return (
    <div className="flex flex-col md:flex-row w-full md:w-[900px] max-h-[85vh] md:h-[600px] bg-white md:rounded-lg overflow-hidden">
      <div className="md:flex-1 md:h-full bg-black flex items-center">
        <ImageCarousel
          images={post.images}
          alt={post.caption ?? `${post.author.username}의 게시물`}
          fillHeight
          className="h-64 md:h-full"
        />
      </div>

      <div className="flex flex-col w-full md:w-[380px] shrink-0 min-h-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <Link to={`/${post.author.username}`} className="flex items-center gap-2.5">
            <Avatar src={post.author.avatar_url} alt={post.author.username} size="sm" />
            <span className="text-sm font-semibold">{post.author.username}</span>
          </Link>
          <PostOptionsMenu
            isOwner={currentUser?.id === post.author.id}
            postId={post.id}
            onDelete={() => deleteMutation.mutate()}
          />
        </header>

        {post.caption && (
          <div className="flex gap-3 px-4 py-3 border-b border-neutral-100">
            <Avatar src={post.author.avatar_url} alt={post.author.username} size="sm" />
            <CaptionText username={post.author.username} caption={post.caption} maxLength={200} />
          </div>
        )}

        <CommentList postId={post.id} postAuthorId={post.author.id} />

        <div className="border-t border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button aria-label="좋아요" onClick={() => requireAuth(() => toggleLike(post))}>
                <Heart size={24} className={clsx(post.is_liked ? 'fill-red-500 text-red-500' : 'text-neutral-900')} />
              </button>
              <MessageCircle size={24} />
              <Send size={24} />
            </div>
            <button aria-label="저장" onClick={() => requireAuth(() => toggleSave(post))}>
              <Bookmark size={24} className={clsx(post.is_saved && 'fill-neutral-900')} />
            </button>
          </div>
          <p className="text-sm font-semibold">좋아요 {post.like_count.toLocaleString()}개</p>
          <p className="text-[11px] text-neutral-400 uppercase mt-1 tracking-wide">
            {formatRelativeTime(post.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
