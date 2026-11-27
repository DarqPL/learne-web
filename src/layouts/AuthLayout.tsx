import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="auth-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 text-foreground">
      <div className="auth-glow-indigo pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl" />
      <div className="auth-glow-violet pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full blur-3xl" />
      <Link to="/" className="relative mb-8 flex items-center gap-3 text-3xl font-black tracking-tight text-primary sm:text-4xl">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">L</span>
        <span>LearnE</span>
      </Link>
      <div className="relative w-full">
        <Outlet />
      </div>
    </div>
  )
}
