import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Download, Loader2, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient } from '../../services/api'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'

// ── Types ──────────────────────────────────────────────────────────────────
// Matches GET /v1/learner/certificates/
interface Certificate {
  id: string
  serial: string
  course_id: string
  course_title: string
  course_slug: string
  issued_at: string
  status: string // "issued" observed; treat anything else as non-final
  is_downloadable: boolean
  final_score: number
  completion_percentage: number
}

// Matches GET /v1/learner/certificates/{id}/download/
interface DownloadResponse {
  download_url: string
  expires_in: number
  filename: string
}

function fmtIssuedDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'issued':
      return { label: 'Issued', color: '#059669', bg: '#ECFDF5' }
    case 'archived':
      return { label: 'Archived', color: '#6B7280', bg: '#F3F4F6' }
    case 'revoked':
      return { label: 'Revoked', color: '#DC2626', bg: '#FEF2F2' }
    default:
      return { label: status || 'Pending', color: '#B45309', bg: '#FFFBEB' }
  }
}

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .content { padding: 2rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 1.5rem; }

  .certs-back { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: #6B7280; background: none; border: none; cursor: pointer; width: fit-content; padding: 0; }
  .certs-back:hover { color: #374151; }

  .certs-title { font-size: 1.375rem; font-weight: 700; color: #111; }
  .certs-sub { font-size: 0.875rem; color: #6B7280; margin-top: 0.2rem; }

  .certs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

  .cert-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .cert-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
  .cert-card-icon { width: 44px; height: 44px; border-radius: 0.75rem; background: #FEF9EC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cert-card-status { font-size: 0.6875rem; font-weight: 700; padding: 0.25rem 0.625rem; border-radius: 1rem; white-space: nowrap; }
  .cert-card-title { font-size: 0.9375rem; font-weight: 700; color: #111; line-height: 1.35; }
  .cert-card-meta { font-size: 0.75rem; color: #9CA3AF; }
  .cert-card-serial { font-size: 0.7rem; color: #9CA3AF; font-family: monospace; }
  .cert-card-stats { display: flex; gap: 1.25rem; font-size: 0.75rem; color: #6B7280; }
  .cert-card-stats strong { color: #111; font-size: 0.875rem; display: block; }

  .cert-download-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; background: #2563EB; color: #fff; border: none; border-radius: 0.625rem; padding: 0.6rem 1rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; margin-top: 0.25rem; }
  .cert-download-btn:hover { opacity: 0.9; }
  .cert-download-btn:disabled { background: #D1D5DB; cursor: not-allowed; }

  .cert-download-error { font-size: 0.75rem; color: #DC2626; }

  .certs-empty { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.625rem; }
  .certs-empty-icon { width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #FEF9EC; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .certs-empty-title { font-size: 1.0625rem; font-weight: 700; color: #111; }
  .certs-empty-sub { font-size: 0.875rem; color: #6B7280; max-width: 420px; line-height: 1.6; }
  .certs-empty-btn { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.875rem; background: #2563EB; color: #fff; border: none; border-radius: 2rem; padding: 0.7rem 1.5rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; }

  @media (max-width: 640px) {
    .content { padding: 1.25rem 1rem 5rem; }
    .certs-grid { grid-template-columns: 1fr; }
  }
`

export default function CertificatesPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState('home')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<Certificate[]>('/v1/learner/certificates/')
        setCertificates(response.data || [])
      } catch (err) {
        console.error('Failed to fetch certificates:', err)
        setError('Failed to load certificates')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchCertificates()
  }, [user])

  async function handleDownload(cert: Certificate) {
    setDownloadingId(cert.id)
    setDownloadErrors((prev) => {
      const next = { ...prev }
      delete next[cert.id]
      return next
    })
    try {
      const response = await apiClient.get<DownloadResponse>(
        `/v1/learner/certificates/${cert.id}/download/`,
      )
      window.open(response.data.download_url, '_blank')
    } catch (err: any) {
      console.error('Failed to get certificate download link:', err)
      const status = err?.response?.status
      let message = 'Something went wrong — try again.'
      if (status === 403) message = 'This certificate has been archived.'
      else if (status === 404) message = err?.response?.data?.detail || "This certificate isn't ready yet."
      setDownloadErrors((prev) => ({ ...prev, [cert.id]: message }))
    } finally {
      setDownloadingId(null)
    }
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading…</p></div>

  const hasCertificates = certificates.length > 0

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="content">
          <button className="certs-back" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <ChevronLeft size={16} /> Back to Dashboard
          </button>

          <div>
            <div className="certs-title">My Certificates</div>
            <div className="certs-sub">Certificates you've earned across all your courses.</div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading certificates...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
          ) : !hasCertificates ? (
            <div className="certs-empty">
              <div className="certs-empty-icon"><Trophy size={26} color="#F59E0B" /></div>
              <div className="certs-empty-title">No certificates yet</div>
              <div className="certs-empty-sub">Finish a course's requirements — modules, final project, and live session attendance — to earn your first certificate.</div>
              <button className="certs-empty-btn" onClick={() => navigate(RouteBuilder.courseCatalogPage())}>
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="certs-grid">
              {certificates.map((cert) => {
                const status = statusLabel(cert.status)
                const canDownload = cert.is_downloadable && cert.status !== 'archived' && cert.status !== 'revoked'
                return (
                  <div key={cert.id} className="cert-card">
                    <div className="cert-card-top">
                      <div className="cert-card-icon"><Trophy size={22} color="#F59E0B" /></div>
                      <div className="cert-card-status" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </div>
                    </div>
                    <div>
                      <div className="cert-card-title">{cert.course_title}</div>
                      <div className="cert-card-meta">Issued {fmtIssuedDate(cert.issued_at)}</div>
                      {cert.serial && <div className="cert-card-serial">{cert.serial}</div>}
                    </div>
                    <div className="cert-card-stats">
                      <div><strong>{cert.completion_percentage}%</strong>Complete</div>
                      {cert.final_score != null && (
                        <div><strong>{cert.final_score}</strong>Final score</div>
                      )}
                    </div>
                    <button
                      className="cert-download-btn"
                      disabled={!canDownload || downloadingId === cert.id}
                      onClick={() => handleDownload(cert)}
                    >
                      {downloadingId === cert.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Download size={14} />}
                      {downloadingId === cert.id ? 'Preparing…' : 'Download PDF'}
                    </button>
                    {downloadErrors[cert.id] && (
                      <div className="cert-download-error">{downloadErrors[cert.id]}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </AppShell>
    </>
  )
}