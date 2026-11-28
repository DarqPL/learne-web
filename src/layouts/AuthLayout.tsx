import { Link, Outlet } from 'react-router-dom'
import { ThemeModeToggle } from '../components/theme/ThemeModeToggle'

export function AuthLayout() {
  return (
    <div className="auth-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 text-foreground">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeModeToggle />
      </div>
      <div className="auth-glow-indigo pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl" />
      <div className="auth-glow-violet pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full blur-3xl" />
      <Link to="/" className="relative mb-8 flex items-center gap-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl text-primary-foreground shadow-lg">L</span>
        <span>LearnE</span>
      </Link>
      <div className="relative w-full">
        <Outlet />
      </div>
    </div>
  )
}
