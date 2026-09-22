import { format, formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatRelativeTime(isoDate: string): string {
  return formatDistanceToNowStrict(new Date(isoDate), { addSuffix: true, locale: ko })
}

export function formatDate(isoDate: string): string {
  return format(new Date(isoDate), 'yyyy.MM.dd')
}
