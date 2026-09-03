import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { ROUTES } from './constants/routes'

// Layout
import PublicLayout from './layouts/PublicLayout'

const LandingPage = lazy(() => import('./pages/public/LandingPage'))

// Auth Pages (no header/footer)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const AcceptInvitePage = lazy(() => import('./pages/auth/AcceptInvitePage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const TermsPage = lazy(() => import('./pages/auth/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/auth/PrivacyPage'))

// App Pages (protected, no public layout)
const OnboardingPage = lazy(() => import('./pages/app/OnboardingPage'))
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage'))
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'))
const CertificatesPage = lazy(() => import('./pages/app/CertificatesPage'))
const CourseCatalogPage = lazy(() => import('./pages/app/CourseCatalgue'))
const CourseDetailPage = lazy(() => import('./pages/app/CourseCatalgue/CourseDetail'))
const CoursePlayerPage = lazy(() => import('./pages/app/CourseCatalgue/CoursePlayer'))
const CourseLearnPage = lazy(() => import('./pages/app/CourseCatalgue/CourseLearnPage'))
const CommunityPage = lazy(() => import('./pages/app/CommunityPage'))
const AssignmentDetailPage = lazy(() => import('./pages/app/CourseCatalgue/AssignmentDetailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const CheckoutPage = lazy(() => import('./pages/app/CourseCatalgue/Checkoutpage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const LiveSessionsPage = lazy(() => import('./pages/app/LiveSessionsPage'))
const LiveSessionDetailPage = lazy(() => import('./pages/app/LiveSessionDetailPage'))
const LiveBookingsPage = lazy(() => import('./pages/app/CourseCatalgue/LiveBookingsPage'))
const TrainerDashboardPage = lazy(() => import('./pages/app/trainer/TrainerDashboardPage'))
const TrainerCoursesPage = lazy(() => import('./pages/app/trainer/TrainerCoursesPage'))
const TrainerProfilePage = lazy(() => import('./pages/app/trainer/TrainerProfilePage'))
const TrainerBookingsPage = lazy(() => import('./pages/app/trainer/bookings/TrainerBookingsPage'))
const TrainerCourseManagePage = lazy(() => import('./pages/app/trainer/courses/TrainerCourseManagePage'))
const TrainerLiveClassesPage = lazy(() => import('./pages/app/trainer/live-classes/TrainerLiveClassesPage'))
const AddCoursePage = lazy(() => import('./pages/app/trainer/courses/AddCoursePage'))
const TrainerReviewsPage = lazy(() => import('./pages/app/trainer/reviews/TrainerReviewsPage'))
const ProfilePage = lazy(() => import('./pages/app/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/app/SettingsPage'))
const SettingsSecurityPage = lazy(() => import('./pages/app/SettingsSecurityPage'))
const HelpSupportPage = lazy(() => import('./pages/app/HelpSupportPage'))
const SettingsNotificationPage = lazy(() => import('./pages/app/SettingsNotificationPage'))
const TrainerCommunityPage = lazy(() => import('./pages/app/trainer/TrainerCommunityPage'))
//admin pages
const AdminRevenuePage = lazy(() => import('./pages/admin/AdminRevenuePage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const AdminCommunityPage = lazy(() => import('./pages/admin/AdminCommunityPage'))
const AdminCourseManagePage = lazy(() => import('./pages/admin/AdminCourseManagePage'))
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'))

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
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#6B7280' }}>Loading…</div>}>
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
                <Route
          path={ROUTES.SIGNUP}
          element={
            isAuthenticated ? <Navigate to={getAuthenticatedHome()} replace /> : <SignupPage />
          }
        />
        <Route
          path={ROUTES.ACCEPT_INVITE}
          element={
            isAuthenticated ? <Navigate to={getAuthenticatedHome()} replace /> : <AcceptInvitePage />
          }
        />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
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
path={ROUTES.COMMUNITY}
element={
  <ProtectedRoute>
<CommunityPage />
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
        <Route path={ROUTES.ADMIN_ACTIVITY} element={<AdminActivityPage />} />  
        <Route path={ROUTES.ADMIN_COMMUNITY} element={<AdminCommunityPage />} />
        <Route path="/admin/courses/create" element={<AddCoursePage />} />
<Route path="/admin/courses/:slug/edit" element={<AdminCourseManagePage />} />
        {/* ===== ERROR ROUTES ===== */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App