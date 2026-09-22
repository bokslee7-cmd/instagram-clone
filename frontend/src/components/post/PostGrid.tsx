import { Heart, MessageCircle, Layers } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Post } from '../../types'

export function PostGrid({ posts }: { posts: Post[] }) {
  const location = useLocation()

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/p/${post.id}`}
          state={{ background: location }}
          className="relative group aspect-square block overflow-hidden bg-neutral-100"
        >
          <img
            src={post.images[0]?.image_url}
            alt={post.caption ?? `${post.author.username}의 게시물`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {post.images.length > 1 && (
            <Layers size={18} className="absolute top-2 right-2 text-white drop-shadow" fill="white" />
          )}
          <div className="absolute inset-0 hidden md:flex items-center justify-center gap-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold">
            <span className="flex items-center gap-1.5">
              <Heart size={20} fill="white" /> {post.like_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={20} fill="white" /> {post.comment_count.toLocaleString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
