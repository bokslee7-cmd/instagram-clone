import { Link, useLocation } from 'react-router-dom'
import { Button } from './Button'

export function GuestBanner() {
  const location = useLocation()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-neutral-200 rounded-md px-4 py-3 mb-4">
      <p className="text-sm text-neutral-600 text-center sm:text-left">
        로그인하고 좋아요, 댓글, 게시물 작성 등 모든 기능을 이용해보세요.
      </p>
      <div className="flex gap-2 shrink-0">
        <Link to="/login" state={{ from: location }}>
          <Button variant="primary" className="!px-6">
            로그인
          </Button>
        </Link>
        <Link to="/signup" state={{ from: location }}>
          <Button variant="secondary" className="!px-6">
            가입하기
          </Button>
        </Link>
      </div>
    </div>
  )
}
