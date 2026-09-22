import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CaptionTextProps {
  username: string
  caption: string
  maxLength?: number
}

export function CaptionText({ username, caption, maxLength = 90 }: CaptionTextProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = caption.length > maxLength

  return (
    <p className="text-sm leading-snug break-words">
      <Link to={`/${username}`} className="font-semibold mr-1.5 hover:underline">
        {username}
      </Link>
      {expanded || !isLong ? caption : `${caption.slice(0, maxLength)}...`}
      {isLong && !expanded && (
        <button onClick={() => setExpanded(true)} className="text-neutral-400 ml-1">
          더 보기
        </button>
      )}
    </p>
  )
}
