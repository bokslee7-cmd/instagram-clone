import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as usersApi from '../api/users'
import { Avatar } from '../components/common/Avatar'
import { Skeleton } from '../components/common/Skeleton'
import { useDebounce } from '../hooks/useDebounce'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: () => usersApi.searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  })

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <h1 className="text-lg font-semibold mb-4">검색</h1>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색"
          aria-label="사용자 검색"
          className="w-full bg-neutral-100 rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} className="text-neutral-400" />
          </button>
        )}
      </div>

      {isFetching &&
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="w-11 h-11 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}

      {!isFetching && debouncedQuery && results.length === 0 && (
        <p className="text-center text-neutral-400 py-12">검색 결과가 없습니다.</p>
      )}

      <ul>
        {results.map((user) => (
          <li key={user.id}>
            <Link to={`/${user.username}`} className="flex items-center gap-3 py-2.5 hover:bg-neutral-50 rounded-lg px-1">
              <Avatar src={user.avatar_url} alt={user.username} />
              <div>
                <p className="text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-neutral-400">{user.full_name}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
