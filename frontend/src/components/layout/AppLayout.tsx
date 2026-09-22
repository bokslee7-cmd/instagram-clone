import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { MobileTabBar } from './MobileTabBar'
import { CreatePostModal } from '../post/CreatePostModal'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <CreatePostModal />
    </div>
  )
}
