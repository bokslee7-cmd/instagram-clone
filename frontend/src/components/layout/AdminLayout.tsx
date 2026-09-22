import { LayoutDashboard, LogOut, Users, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: '회원 관리', icon: Users, end: false },
  { to: '/admin/posts', label: '게시물 관리', icon: ImageIcon, end: false },
]

export function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-neutral-200 bg-white px-3 py-6">
        <div className="px-3 mb-8">
          <span className="font-logo text-2xl">Instagram</span>
          <p className="text-xs text-neutral-400 font-semibold mt-0.5">관리자 콘솔</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-sky-50 text-sky-600 font-semibold' : 'text-neutral-600 hover:bg-neutral-100',
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft size={20} />
            앱으로 돌아가기
          </NavLink>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
