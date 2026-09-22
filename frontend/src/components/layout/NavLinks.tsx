import { Compass, Heart, Home, PlusSquare, Search, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  action?: 'create'
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '홈', icon: Home },
  { to: '/search', label: '검색', icon: Search },
  { to: '/explore', label: '탐색', icon: Compass },
  { to: '/direct/inbox', label: '메시지', icon: Send },
  { to: '#create', label: '만들기', icon: PlusSquare, action: 'create' },
  { to: '/notifications', label: '알림', icon: Heart },
]
