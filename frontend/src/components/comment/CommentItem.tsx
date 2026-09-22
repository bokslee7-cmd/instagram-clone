import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '../common/Avatar'
import { formatRelativeTime } from '../../utils/time'
import type { Comment } from '../../types'

interface CommentItemProps {
  comment: Comment
  canDelete?: boolean
  onDelete?: (id: number) => void
  onLike?: (id: number) => void
  onReply?: (comment: Comment) => void
  depth?: number
}

export function CommentItem({ comment, canDelete, onDelete, onLike, onReply, depth = 0 }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.is_liked)
  const [likeCount, setLikeCount] = useState(comment.like_count)

  const handleLike = () => {
    setLiked((prev) => !prev)
    setLikeCount((prev) => prev + (liked ? -1 : 1))
    onLike?.(comment.id)
  }

  return (
    <div className={clsx('flex gap-3', depth > 0 && 'ml-11 mt-3')}>
      <Link to={`/${comment.author.username}`}>
        <Avatar src={comment.author.avatar_url} alt={comment.author.username} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm break-words">
          <Link to={`/${comment.author.username}`} className="font-semibold mr-1.5 hover:underline">
            {comment.author.username}
          </Link>
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
          <span>{formatRelativeTime(comment.created_at)}</span>
          {likeCount > 0 && <span>좋아요 {likeCount}개</span>}
          {depth === 0 && (
            <button onClick={() => onReply?.(comment)} className="font-semibold">
              답글 달기
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete?.(comment.id)} className="font-semibold">
              삭제
            </button>
          )}
        </div>

        {comment.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            onLike={onLike}
            onReply={onReply}
            canDelete={canDelete}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button onClick={handleLike} aria-label="댓글 좋아요" className="pt-1">
        <Heart size={12} className={clsx(liked ? 'fill-red-500 text-red-500' : 'text-neutral-400')} />
      </button>
    </div>
  )
}
