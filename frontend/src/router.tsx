import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AdminRoute } from './components/layout/AdminRoute'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { GuestOnlyRoute } from './components/layout/GuestOnlyRoute'
import { PostModal } from './components/post/PostModal'
import { Spinner } from './components/common/Spinner'

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const FeedPage = lazy(() => import('./pages/FeedPage').then((m) => ({ default: m.FeedPage })))
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
)
const SavedPostsPage = lazy(() => import('./pages/SavedPostsPage').then((m) => ({ default: m.SavedPostsPage })))
const DirectMessagesPage = lazy(() =>
  import('./pages/DirectMessagesPage').then((m) => ({ default: m.DirectMessagesPage })),
)
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const EditProfilePage = lazy(() =>
  import('./pages/EditProfilePage').then((m) => ({ default: m.EditProfilePage })),
)
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })))
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminPostsPage = lazy(() =>
  import('./pages/admin/AdminPostsPage').then((m) => ({ default: m.AdminPostsPage })),
)

function PageFallback() {
  return (
    <div className="flex justify-center py-24">
      <Spinner className="w-8 h-8" />
    </div>
  )
}

export function AppRoutes() {
  const location = useLocation()
  const state = location.state as { background?: Location } | null
  const backgroundLocation = state?.background

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes location={backgroundLocation ?? location}>
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/posts" element={<AdminPostsPage />} />
            </Route>
          </Route>

          <Route element={<AppLayout />}>
            {/* 비로그인 사용자도 열람 가능한 공개 라우트 */}
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/p/:postId" element={<PostDetailPage />} />
            <Route path="/:username" element={<ProfilePage />} />

            {/* 로그인이 필요한 라우트 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/saved" element={<SavedPostsPage />} />
              <Route path="/direct/inbox" element={<DirectMessagesPage />} />
              <Route path="/direct/t/:threadId" element={<DirectMessagesPage />} />
              <Route path="/:username/edit" element={<EditProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      {backgroundLocation && (
        <Routes>
          <Route path="/p/:postId" element={<PostModal />} />
        </Routes>
      )}
    </>
  )
}
