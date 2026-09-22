import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminApi from '../../api/admin'
import { Skeleton } from '../../components/common/Skeleton'
import { formatDate } from '../../utils/time'

const PAGE_SIZE = 24

export function AdminPostsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', page],
    queryFn: () => adminApi.getPosts(page, PAGE_SIZE),
  })

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => adminApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })

  const handleDelete = (postId: number) => {
    if (window.confirm('이 게시물을 삭제할까요? 되돌릴 수 없습니다.')) {
      deleteMutation.mutate(postId)
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold">게시물 관리</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <p className="text-center text-neutral-400 py-16">게시물이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.items.map((post) => (
            <div key={post.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="relative aspect-square bg-neutral-100">
                {post.images[0] && (
                  <img src={post.images[0].image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-2.5 space-y-1.5">
                <Link to={`/${post.author.username}`} className="text-xs font-semibold hover:underline block truncate">
                  {post.author.username}
                </Link>
                <p className="text-[11px] text-neutral-400">{formatDate(post.created_at)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {post.comment_count}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleteMutation.isPending}
                    className="text-[11px] font-semibold text-red-500 hover:underline disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>총 {data.total.toLocaleString()}개</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-neutral-200 disabled:opacity-40"
              aria-label="이전 페이지"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {data.total_pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="p-1.5 rounded border border-neutral-200 disabled:opacity-40"
              aria-label="다음 페이지"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
