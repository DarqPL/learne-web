import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_32%),linear-gradient(135deg,_#fafafa_0%,_#f5f3ff_48%,_#eef2ff_100%)] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl" />
      <Link to="/" className="relative mb-8 text-2xl font-bold tracking-tight text-indigo-700">
        LearnE
      </Link>
      <div className="relative w-full">
        <Outlet />
      </div>
    </div>
  )
}
