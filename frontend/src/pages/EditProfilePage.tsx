import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Avatar } from '../components/common/Avatar'
import { Button } from '../components/common/Button'
import * as usersApi from '../api/users'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  username: z.string().min(2, '2자 이상 입력하세요').max(30),
  full_name: z.string().max(50).optional(),
  email: z.string().min(1, '이메일을 입력하세요').email('올바른 이메일 형식이 아닙니다'),
  bio: z.string().max(150, '150자 이내로 입력하세요').optional(),
  website: z.string().max(255).optional().or(z.literal('')),
  is_private: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function EditProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? '',
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? '',
      website: user?.website ?? '',
      is_private: user?.is_private ?? false,
    },
  })

  const bio = watch('bio') ?? ''

  const mutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updated) => {
      if (user) setUser({ ...user, ...updated })
      navigate(`/${updated.username}`)
    },
  })

  const avatarMutation = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (updated) => {
      if (user) setUser({ ...user, ...updated })
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) avatarMutation.mutate(file)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold mb-6">프로필 편집</h1>

      <div className="flex items-center gap-4 mb-8 bg-neutral-50 rounded-lg p-4">
        <Avatar src={user.avatar_url} alt={user.username} size="lg" />
        <div>
          <p className="font-semibold">{user.username}</p>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            disabled={avatarMutation.isPending}
            onClick={() => avatarInputRef.current?.click()}
            className="text-sky-500 text-sm font-semibold disabled:opacity-50"
          >
            {avatarMutation.isPending ? '업로드 중...' : '사진 변경'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5">아이디</label>
          <input
            {...register('username')}
            className="w-full text-sm bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-500"
          />
          {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">이름</label>
          <input
            {...register('full_name')}
            className="w-full text-sm bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">이메일</label>
          <input
            type="email"
            {...register('email')}
            className="w-full text-sm bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-500"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">소개</label>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={150}
            className="w-full text-sm bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-500 resize-none"
          />
          <div className="flex justify-between mt-1">
            {errors.bio ? (
              <p className="text-xs text-red-500">{errors.bio.message}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-neutral-400">{bio.length}/150</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">웹사이트</label>
          <input
            {...register('website')}
            placeholder="https://"
            className="w-full text-sm bg-white border border-neutral-300 rounded-md px-3 py-2 outline-none focus:border-neutral-500"
          />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <div>
            <p className="text-sm font-semibold">비공개 계정</p>
            <p className="text-xs text-neutral-400">팔로워만 게시물을 볼 수 있습니다.</p>
          </div>
          <input type="checkbox" {...register('is_private')} className="w-5 h-5" />
        </div>

        {mutation.isError && <p className="text-xs text-red-500">{mutation.error.message}</p>}

        <Button type="submit" isLoading={mutation.isPending}>
          제출
        </Button>
      </form>
    </div>
  )
}
