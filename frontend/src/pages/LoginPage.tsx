import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  usernameOrEmail: z.string().min(1, '아이디 또는 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    login(values).catch(() => {})
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-neutral-200 rounded-md px-10 py-12">
          <div className="flex flex-col items-center gap-2 mb-8">
            <h1 className="font-logo text-5xl">
              Instagram
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <div>
              <input
                {...register('usernameOrEmail')}
                placeholder="전화번호, 사용자 이름 또는 이메일"
                aria-label="아이디 또는 이메일"
                className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-sm px-3 py-2 outline-none focus:border-neutral-400"
              />
              {errors.usernameOrEmail && (
                <p className="text-xs text-red-500 mt-1">{errors.usernameOrEmail.message}</p>
              )}
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

            {loginError && <p className="text-xs text-red-500 text-center">{loginError.message}</p>}

            <Button type="submit" fullWidth isLoading={isLoggingIn} className="!mt-4">
              로그인
            </Button>
          </form>

          <p className="text-xs text-neutral-400 text-center mt-4">
            데모 계정(seed.py): <span className="font-semibold">alice</span> / password123
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-md py-5 mt-3 text-center text-sm">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-sky-500 font-semibold">
            가입하기
          </Link>
        </div>
      </div>
    </div>
  )
}
