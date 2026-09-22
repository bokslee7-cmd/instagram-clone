import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { PostDetailContent } from './PostDetailContent'

export function PostModal() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  return (
    <Modal isOpen onClose={() => navigate(-1)} className="p-0 overflow-hidden" showCloseButton>
      <PostDetailContent postId={Number(postId)} />
    </Modal>
  )
}
