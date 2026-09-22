import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { ThreadList } from '../components/messages/ThreadList'
import { ThreadConversation } from '../components/messages/ThreadConversation'
import { NewMessageModal } from '../components/messages/NewMessageModal'

export function DirectMessagesPage() {
  const { threadId } = useParams<{ threadId?: string }>()
  const navigate = useNavigate()
  const [showNewMessage, setShowNewMessage] = useState(false)
  const activeThreadId = threadId ? Number(threadId) : undefined

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-dvh border-neutral-200 md:border-l">
      <div className={clsx('w-full md:w-[380px] md:border-r border-neutral-200 shrink-0', activeThreadId && 'hidden md:block')}>
        <ThreadList activeThreadId={activeThreadId} onNewMessage={() => setShowNewMessage(true)} />
      </div>

      <div className={clsx('flex-1 min-w-0', !activeThreadId && 'hidden md:flex')}>
        {activeThreadId ? (
          <ThreadConversation key={activeThreadId} threadId={activeThreadId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <MessageCircle size={64} strokeWidth={1} />
            <p className="text-sm">대화를 선택하거나 새 메시지를 보내보세요.</p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="mt-1 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600"
            >
              새 메시지
            </button>
          </div>
        )}
      </div>

      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onThreadReady={(id) => {
            setShowNewMessage(false)
            navigate(`/direct/t/${id}`)
          }}
        />
      )}
    </div>
  )
}
