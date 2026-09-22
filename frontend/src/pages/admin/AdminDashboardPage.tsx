import { useQuery } from '@tanstack/react-query'
import { Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as adminApi from '../../api/admin'
import { SignupsBarChart } from '../../components/admin/SignupsBarChart'
import { Skeleton } from '../../components/common/Skeleton'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value.toLocaleString()}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30_000,
  })

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-56" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-xl font-semibold">대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatTile label="전체 회원" value={stats.total_users} />
        <StatTile label="활성 회원" value={stats.active_users} />
        <StatTile label="탈퇴 회원" value={stats.deactivated_users} />
        <StatTile label="오늘 신규 가입" value={stats.new_users_today} />
        <StatTile label="전체 게시물" value={stats.total_posts} />
        <StatTile label="전체 댓글" value={stats.total_comments} />
        <StatTile label="전체 좋아요" value={stats.total_likes} />
        <StatTile label="팔로우 관계" value={stats.total_follows} />
        <StatTile label="DM 메시지" value={stats.total_direct_messages} />
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">최근 14일 신규 가입자 추이</h2>
        <SignupsBarChart data={stats.signups_last_14_days} />
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">인기 게시물 TOP 5 (좋아요 기준)</h2>
        {stats.top_posts.length === 0 ? (
          <p className="text-sm text-neutral-400">아직 게시물이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {stats.top_posts.map((post, i) => (
              <li key={post.id} className="flex items-center gap-3 py-2.5">
                <span className="text-sm font-semibold text-neutral-400 w-4 shrink-0">{i + 1}</span>
                {post.images[0] && (
                  <img
                    src={post.images[0].image_url}
                    alt=""
                    className="w-11 h-11 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/${post.author.username}`} className="text-sm font-semibold hover:underline">
                    {post.author.username}
                  </Link>
                  {post.caption && <p className="text-xs text-neutral-500 truncate">{post.caption}</p>}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0">
                  <span className="flex items-center gap-1">
                    <Heart size={14} /> {post.like_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} /> {post.comment_count.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
