import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { ROUTES } from './constants/routes'

// Layout
import PublicLayout from './layouts/PublicLayout'

import LandingPage from './pages/public/LandingPage'

// Auth Pages (no header/footer)
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import TermsPage from './pages/auth/TermsPage'
import PrivacyPage from './pages/auth/PrivacyPage'

// App Pages (protected, no public layout)
import OnboardingPage from './pages/app/OnboardingPage'
import EmailVerificationPage from './pages/auth/EmailVerificationPage'
import DashboardPage from './pages/app/DashboardPage'
import CourseCatalogPage from './pages/app/CourseCatalgue'
import CourseDetailPage from './pages/app/CourseCatalgue/CourseDetail'
import CoursePlayerPage from './pages/app/CourseCatalgue/CoursePlayer'
import CourseLearnPage from './pages/app/CourseCatalgue/CourseLearnPage'
import AssignmentDetailPage from './pages/app/CourseCatalgue/AssignmentDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutPage from './pages/app/CourseCatalgue/Checkoutpage'

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
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path={ROUTES.TERMS} element={<TermsPage />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />

        {/* ===== PROTECTED APP ROUTES */}
        <Route
          path={ROUTES.ONBOARDING}
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.CHECKOUT} element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="learner">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
<Route
  path={ROUTES.COURSES}
  element={
    <ProtectedRoute requiredRole="learner">
      <CourseCatalogPage />
    </ProtectedRoute>
  }
/>
<Route path="/courses/:slug" element={<ProtectedRoute requiredRole="learner"><CourseDetailPage /></ProtectedRoute>} />
<Route path="/courses/:slug/preview" element={<ProtectedRoute requiredRole="learner"><CoursePlayerPage /></ProtectedRoute>} />
<Route path={ROUTES.COURSE_LEARN} element={<ProtectedRoute requiredRole="learner"><CourseLearnPage /></ProtectedRoute>} />
<Route path={ROUTES.ASSIGNMENT_DETAIL} element={<ProtectedRoute requiredRole="learner"><AssignmentDetailPage /></ProtectedRoute>} />
        {/* ===== ERROR ROUTES ===== */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </Router>
  )
}

export default App