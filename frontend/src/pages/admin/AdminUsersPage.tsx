import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import * as adminApi from '../../api/admin'
import { Avatar } from '../../components/common/Avatar'
import { Skeleton } from '../../components/common/Skeleton'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDate } from '../../utils/time'

const PAGE_SIZE = 20

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, debouncedQuery],
    queryFn: () => adminApi.getUsers(page, PAGE_SIZE, debouncedQuery),
  })

  const deactivateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })

  const handleDeactivate = (userId: number, username: string) => {
    if (window.confirm(`${username} 계정을 탈퇴 처리할까요? 로그인이 즉시 차단됩니다.`)) {
      deactivateMutation.mutate(userId)
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">회원 관리</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="아이디 또는 이메일 검색"
            className="bg-white border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">회원</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium text-right">게시물</th>
                <th className="px-4 py-3 font-medium text-right">팔로워</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="px-4 py-3" colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}

              {data?.items.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={user.avatar_url} alt={user.username} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1">
                          {user.username}
                          {user.is_admin && <ShieldCheck size={14} className="text-sky-500 shrink-0" />}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{user.full_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">{user.post_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{user.follower_count.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600">
                        활성
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-500">
                        탈퇴
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.is_admin ? (
                      <span className="text-xs text-neutral-300">-</span>
                    ) : user.is_active ? (
                      <button
                        onClick={() => handleDeactivate(user.id, user.username)}
                        disabled={deactivateMutation.isPending}
                        className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                      >
                        탈퇴 처리
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-300">처리됨</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            총 {data.total.toLocaleString()}명 중 {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, data.total)}명
          </span>
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
