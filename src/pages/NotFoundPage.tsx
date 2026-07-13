import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuthStore } from '../store/auth'

const NotFoundPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()

  const homeRoute = !isAuthenticated
    ? ROUTES.LOGIN
    : user?.role === 'trainer'
      ? ROUTES.TRAINER_DASHBOARD
      : ROUTES.DASHBOARD

  const homeLabel = !isAuthenticated
    ? 'Go to Login'
    : user?.role === 'trainer'
      ? 'Go to Dashboard'
      : 'Go to Dashboard'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={homeRoute}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage