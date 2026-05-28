import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/Button'
import { ROUTES } from '../../constants/routes'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN)
    }
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .dashboard-container {
          min-height: 100vh;
          background: var(--grey);
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          background: var(--white);
          padding: 1.5rem 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .dashboard-logo img {
          height: 2.5rem;
        }

        .dashboard-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info h3 {
          margin: 0;
          color: var(--black);
          font-size: 1rem;
          font-weight: 600;
        }

        .user-info p {
          margin: 0.25rem 0 0 0;
          color: var(--grey);
          font-size: 0.875rem;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-card {
          background: var(--white);
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          margin-bottom: 2rem;
          text-align: center;
        }

        .welcome-card h1 {
          color: var(--black);
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
        }

        .welcome-card p {
          color: var(--grey);
          font-size: 1rem;
          margin: 0;
          line-height: 1.6;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .dashboard-card {
          background: var(--white);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .dashboard-card.clickable {
          cursor: pointer;
        }

        .dashboard-card.clickable:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.10);
          transform: translateY(-2px);
        }

        .dashboard-card h3 {
          color: var(--black);
          font-size: 1rem;
          margin: 0 0 0.75rem 0;
          font-weight: 600;
        }

        .dashboard-card p {
          color: var(--grey);
          font-size: 0.875rem;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }

        .dashboard-card-content {
          text-align: center;
          padding: 2rem 0;
          color: var(--primary-500);
          font-size: 3rem;
          font-weight: 700;
        }

        .card-arrow {
          display: flex;
          justify-content: flex-end;
          color: var(--primary-500);
          font-size: 0.8125rem;
          font-weight: 600;
          margin-top: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .dashboard-card.clickable:hover .card-arrow {
          opacity: 1;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-logo">
            <img src="/Logo.png" alt="TGPL" />
          </div>

          <div className="dashboard-user">
            <div className="user-info">
              <h3>{user.name || user.email}</h3>
              <p>{user.email}</p>
            </div>
            <Button variant="outline" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {/* Welcome Card */}
          <div className="welcome-card">
            <h1>Welcome back, {user.name}! </h1>
            <p>You're all set. Design coming soon — stay tuned for the full dashboard experience.</p>
          </div>

          {/* Quick Stats */}
          <div className="dashboard-grid">
            <div
              className="dashboard-card clickable"
              onClick={() => navigate(ROUTES.COURSES)}
            >
              <h3>Courses</h3>
              <p>Explore and enroll in courses</p>
              <div className="dashboard-card-content">0</div>
              <div className="card-arrow">Browse courses →</div>
            </div>

            <div className="dashboard-card">
              <h3>Progress</h3>
              <p>Track your learning progress</p>
              <div className="dashboard-card-content">—</div>
            </div>

            <div className="dashboard-card">
              <h3>Certificates</h3>
              <p>Earned certifications</p>
              <div className="dashboard-card-content">0</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}