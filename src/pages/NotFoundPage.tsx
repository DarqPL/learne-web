import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth/auth-context'
import { homePathFor } from '../lib/auth/routes'

export function NotFoundPage() {
  const { user } = useAuth()
  const home = user ? homePathFor(user.role) : '/login'
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
      <p className="mb-6 text-muted-foreground">Trang bạn tìm không tồn tại.</p>
      <Link to={home} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Về trang chủ
      </Link>
    </div>
  )
}
