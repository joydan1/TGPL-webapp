import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import CertificatesPage from './pages/app/CertificatesPage'
import CourseCatalogPage from './pages/app/CourseCatalgue'
import CourseDetailPage from './pages/app/CourseCatalgue/CourseDetail'
import CoursePlayerPage from './pages/app/CourseCatalgue/CoursePlayer'
import CourseLearnPage from './pages/app/CourseCatalgue/CourseLearnPage'
import AssignmentDetailPage from './pages/app/CourseCatalgue/AssignmentDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import CheckoutPage from './pages/app/CourseCatalgue/Checkoutpage'
import NotificationsPage from './pages/NotificationsPage'
import LiveSessionsPage from './pages/app/LiveSessionsPage'
import LiveSessionDetailPage from './pages/app/LiveSessionDetailPage'
import LiveBookingsPage from './pages/app/CourseCatalgue/LiveBookingsPage'
import TrainerDashboardPage from './pages/app/trainer/TrainerDashboardPage'
import TrainerCoursesPage from './pages/app/trainer/TrainerCoursesPage'
import TrainerProfilePage from './pages/app/trainer/TrainerProfilePage'
import TrainerBookingsPage from './pages/app/trainer/bookings/TrainerBookingsPage'
import TrainerCourseManagePage from './pages/app/trainer/courses/TrainerCourseManagePage'
import TrainerLiveClassesPage from './pages/app/trainer/live-classes/TrainerLiveClassesPage'
import AddCoursePage from './pages/app/trainer/courses/AddCoursePage'
import TrainerReviewsPage from './pages/app/trainer/reviews/TrainerReviewsPage'
import ProfilePage from './pages/app/ProfilePage.tsx'
import SettingsPage from './pages/app/SettingsPage.tsx'
import SettingsSecurityPage from './pages/app/SettingsSecurityPage'
import HelpSupportPage from './pages/app/HelpSupportPage'
import SettingsNotificationPage from './pages/app/SettingsNotificationPage'
import TrainerCommunityPage from './pages/app/trainer/TrainerCommunityPage'
//admin pages
import AdminRevenuePage from './pages/admin/AdminRevenuePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminLoginPage from './pages/admin/AdminLoginPage.tsx'
import AdminSettingsPage from './pages/admin/AdminSettingsPage.tsx'
import AdminCommunityPage from './pages/admin/AdminCommunityPage.tsx'


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

function DashboardPageWrapper() {
  const location = useLocation()
  return <DashboardPage key={location.key} />
}

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const getAuthenticatedHome = () =>
    user?.role === 'trainer' ? ROUTES.TRAINER_DASHBOARD : ROUTES.DASHBOARD

  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES (with Header & Footer) ===== */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={getAuthenticatedHome()} replace />
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
            isAuthenticated ? <Navigate to={getAuthenticatedHome()} replace /> : <LoginPage />
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={
            isAuthenticated ? <Navigate to={getAuthenticatedHome()} replace /> : <SignupPage />
          }
        />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path={ROUTES.TERMS} element={<TermsPage />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />

        {/* ===== PROTECTED APP ROUTES ===== */}
        <Route
          path={ROUTES.ONBOARDING}
          element={
            <ProtectedRoute requiredRole="learner">
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
  path={ROUTES.SETTINGS_SECURITY}
  element={
    <ProtectedRoute>
      <SettingsSecurityPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.SETTINGS_NOTIFICATIONS}
  element={
    <ProtectedRoute>
      <SettingsNotificationPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.HELP_SUPPORT}
  element={
    <ProtectedRoute>
      <HelpSupportPage />
    </ProtectedRoute>
  }
/>
        
        <Route
          path={ROUTES.CHECKOUT}
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="learner">
              <DashboardPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TRAINER_DASHBOARD}
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
  path={ROUTES.TRAINER_COURSES}
  element={
    <ProtectedRoute requiredRole="trainer">
      <TrainerCoursesPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.TRAINER_PROFILE}
  element={
    <ProtectedRoute requiredRole="trainer">
      <TrainerProfilePage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.TRAINER_COURSE_ADD}
  element={
    <ProtectedRoute requiredRole="trainer">
      <AddCoursePage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.TRAINER_COURSE_MANAGE}
  element={
    <ProtectedRoute requiredRole="trainer">
      <TrainerCourseManagePage />
    </ProtectedRoute>
  }
/>

<Route
  path={ROUTES.TRAINER_REVIEWS}
  element={
    <ProtectedRoute requiredRole="trainer">
      <TrainerReviewsPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.TRAINER_COURSE_EDIT}
  element={
    <ProtectedRoute requiredRole="trainer">
      <AddCoursePage />
    </ProtectedRoute>
  }
/>
<Route path={ROUTES.TRAINER_BOOKINGS} element={<TrainerBookingsPage />} />
<Route path={ROUTES.TRAINER_COMMUNITY} element={<TrainerCommunityPage />} />
<Route
  path={ROUTES.TRAINER_LIVE_CLASSES}
  element={
    <ProtectedRoute requiredRole="trainer">
      <TrainerLiveClassesPage />
    </ProtectedRoute>
  }
/>

      <Route
  path={ROUTES.NOTIFICATIONS}
  element={
    <ProtectedRoute requiredRole="learner">
      <NotificationsPage />
    </ProtectedRoute>
  }
/>
<Route
  path={ROUTES.TRAINER_NOTIFICATIONS}
  element={
    <ProtectedRoute requiredRole="trainer">
      <NotificationsPage />
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
        <Route
          path="/courses/:slug"
          element={
            <ProtectedRoute requiredRole="learner">
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.CERTIFICATES} element={<CertificatesPage />} />
        <Route
          path="/courses/:slug/preview"
          element={
            <ProtectedRoute requiredRole="learner">
              <CoursePlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.COURSE_LEARN}
          element={
            <ProtectedRoute requiredRole="learner">
              <CourseLearnPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ASSIGNMENT_DETAIL}
          element={
            <ProtectedRoute requiredRole="learner">
              <AssignmentDetailPage />
            </ProtectedRoute>
          }
        />
<Route
  path={ROUTES.LIVE_SESSIONS}
  element={
    <ProtectedRoute requiredRole="learner">
      <LiveSessionsPage />
    </ProtectedRoute>
  }
/>
        <Route
          path={ROUTES.TUTOR_BOOKING}
          element={
            <ProtectedRoute requiredRole="learner">
              <LiveBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.LIVE_SESSION_DETAIL}
          element={
            <ProtectedRoute requiredRole="learner">
              <LiveSessionDetailPage />
            </ProtectedRoute>
          }
        />
        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_REVENUE}
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRevenuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_USERS}
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_COURSES}
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_LOGIN}
          element={
            <AdminLoginPage />
          }
        />
        <Route
        path={ROUTES.ADMIN_SETTINGS}
        element={
          <AdminSettingsPage />
        }
        />
        <Route path={ROUTES.ADMIN_COMMUNITY} element={<AdminCommunityPage />} />
        <Route path="/admin/courses/create" element={<AddCoursePage />} />
<Route path="/admin/courses/:id/edit" element={<AddCoursePage />} />
        {/* ===== ERROR ROUTES ===== */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </Router>
  )
}

export default App