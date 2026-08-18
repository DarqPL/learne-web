import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link to="/" className="mb-6 text-2xl font-bold text-indigo-600">
        LearnE
      </Link>
      <Outlet />
    </div>
  )
}