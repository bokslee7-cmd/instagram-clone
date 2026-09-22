export interface User {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  bio?: string | null
  website?: string | null
  is_private: boolean
  post_count: number
  follower_count: number
  following_count: number
  is_following?: boolean
}

export interface CurrentUser extends User {
  email: string
  is_admin: boolean
}

export interface PostImage {
  id: number
  image_url: string
  order_index: number
}

export interface Comment {
  id: number
  post_id: number
  author: User
  parent_id: number | null
  content: string
  like_count: number
  is_liked: boolean
  created_at: string
  replies?: Comment[]
}

export interface Post {
  id: number
  author: User
  caption: string | null
  location?: string | null
  images: PostImage[]
  like_count: number
  comment_count: number
  is_liked: boolean
  is_saved: boolean
  created_at: string
}

export type NotificationType = 'like' | 'comment' | 'follow'

export interface AppNotification {
  id: number
  type: NotificationType
  actor: User
  post?: Pick<Post, 'id' | 'images'>
  is_read: boolean
  created_at: string
}

export interface PaginatedResult<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
}

export interface DirectMessage {
  id: number
  thread_id: number
  sender_id: number
  content: string
  created_at: string
  is_read: boolean
}

export interface DirectThread {
  id: number
  participant: User
  last_message: DirectMessage | null
  unread_count: number
  updated_at: string
}

export interface DirectThreadDetail {
  thread: DirectThread
  messages: DirectMessage[]
}

export interface AdminUser extends User {
  email: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface AdminPaginatedResult<T> {
  items: T[]
  page: number
  size: number
  total: number
  total_pages: number
}

export interface DailySignupCount {
  date: string
  count: number
}

export interface AdminStats {
  total_users: number
  active_users: number
  deactivated_users: number
  total_posts: number
  total_comments: number
  total_likes: number
  total_follows: number
  total_direct_messages: number
  new_users_today: number
  signups_last_14_days: DailySignupCount[]
  top_posts: Post[]
}
