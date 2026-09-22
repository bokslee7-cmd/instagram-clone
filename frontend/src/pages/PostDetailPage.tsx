import { useParams } from 'react-router-dom'
import { PostDetailContent } from '../components/post/PostDetailContent'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()

  return (
    <div className="flex justify-center py-6 px-2">
      <div className="border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
        <PostDetailContent postId={Number(postId)} />
      </div>
    </div>
  )
}
