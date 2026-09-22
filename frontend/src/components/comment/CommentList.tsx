import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import * as commentsApi from '../../api/comments'
import { useAuthStore } from '../../store/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { CommentItem } from './CommentItem'
import { CommentInput } from './CommentInput'
import { Skeleton } from '../common/Skeleton'
import type { Comment } from '../../types'

export function CommentList({ postId, postAuthorId }: { postId: number; postAuthorId: number }) {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const { requireAuth } = useRequireAuth()
  const [replyTo, setReplyTo] = useState<Comment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsApi.getComments(postId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    queryClient.invalidateQueries({ queryKey: ['post', postId] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: number | null }) =>
      commentsApi.createComment({ postId, ...payload }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: commentsApi.deleteComment,
    onSuccess: invalidate,
  })

  const likeMutation = useMutation({
    mutationFn: commentsApi.likeComment,
  })

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-8">아직 댓글이 없습니다.</p>}
        {items.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            canDelete={currentUser?.id === comment.author.id || currentUser?.id === postAuthorId}
            onDelete={(id) => deleteMutation.mutate(id)}
            onLike={(id) => requireAuth(() => likeMutation.mutate(id))}
            onReply={(comment) => requireAuth(() => setReplyTo(comment))}
          />
        ))}
      </div>
      <CommentInput
        key={replyTo?.id ?? 'root'}
        placeholder={replyTo ? `${replyTo.author.username}님에게 답글 달기...` : '댓글 달기...'}
        autoFocus={!!replyTo}
        isSubmitting={createMutation.isPending}
        onSubmit={(content) => {
          requireAuth(() => {
            createMutation.mutate({ content, parentId: replyTo?.id ?? null })
            setReplyTo(null)
          })
        }}
      />
    </div>
  )
}
