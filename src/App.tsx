import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { ROUTES } from './constants/routes'

// Layout
import PublicLayout from './layouts/PublicLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'


// Auth Pages (no header/footer)
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// App Pages (protected, no public layout)
import OnboardingPage from './pages/app/OnboardingPage'
import DashboardPage from './pages/app/DashboardPage'

// Error Pages
import NotFoundPage from './pages/NotFoundPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'learner' | 'trainer' | 'admin'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <>{children}</>
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES (with Header & Footer) ===== */}
        <Route element={<PublicLayout />}>
          {/* Home route – conditionally render LandingPage or redirect to dashboard */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={ROUTES.DASHBOARD} replace />
              ) : (
                <LandingPage />
              )
            }
          />
          
        </Route>

        {/* ===== AUTH ROUTES (no header/footer) ===== */}
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LoginPage />
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={
            isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <SignupPage />
          }
        />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        {/* ===== PROTECTED APP ROUTES (no header/footer) ===== */}
        <Route
          path={ROUTES.ONBOARDING}
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="learner">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ===== ERROR ROUTES ===== */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </Router>
  )
}

export default App