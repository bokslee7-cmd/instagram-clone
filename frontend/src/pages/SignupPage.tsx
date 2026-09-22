import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

const schema = z
  .object({
    username: z.string().min(2, '2자 이상 입력하세요').max(30),
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(8, '8자 이상 입력하세요'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const { signup, isSigningUp, signupError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    signup(values).catch(() => {})
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-neutral-200 rounded-md px-10 py-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <h1 className="font-logo text-4xl text-center">
              Instagram
            </h1>
            <p className="text-neutral-400 text-sm font-semibold text-center">
              친구들의 사진과 동영상을 보려면 가입하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <div>
              <input
                {...register('email')}
                placeholder="이메일 주소"
                aria-label="이메일"
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-sm px-3 py-2 outline-none focus:border-neutral-400"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <input
                {...register('username')}
                placeholder="사용자 이름"
                aria-label="사용자 이름"
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-sm px-3 py-2 outline-none focus:border-neutral-400"
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <input
                type="password"
                {...register('password')}
                placeholder="비밀번호"
                aria-label="비밀번호"
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-sm px-3 py-2 outline-none focus:border-neutral-400"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="비밀번호 확인"
                aria-label="비밀번호 확인"
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-sm px-3 py-2 outline-none focus:border-neutral-400"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {signupError && <p className="text-xs text-red-500 text-center">{signupError.message}</p>}

            <Button type="submit" fullWidth isLoading={isSigningUp} className="!mt-4">
              가입
            </Button>
          </form>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md py-5 mt-3 text-center text-sm">
          계정이 있으신가요?{' '}
          <Link to="/login" className="text-sky-500 font-semibold">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
