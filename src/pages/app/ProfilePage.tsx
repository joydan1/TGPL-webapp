import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, Mail, Phone, Globe, AlertCircle, FileText, User, Check, X, VideoOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import { apiClient } from '../../services/api'
import SettingsLayout from '../../components/layout/SettingsLayout'

interface UserProfile {
  first_name: string
  last_name: string
  email: string
  is_email_verified: boolean
  phone: string | null
  country: string | null
  bio: string | null
  avatar_url: string | null
}

const BIO_MAX_LEN = 200
const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png']

// Country stored/sent as full display name (e.g. "Nigeria"), not ISO code —
// storage accepts either, this is the agreed convention going forward.
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
  'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Lucia', 'Samoa', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
 
  * { box-sizing: border-box; }

  .profile-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; margin-top: 0.25rem; padding: 1.5rem; grid-column: 1 / -1; }

  .avatar-row { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
  .avatar-wrap { position: relative; width: 96px; height: 96px; flex-shrink: 0; }
  .avatar-img { width: 96px; height: 96px; border-radius: 999px; object-fit: cover; background: #E5E7EB; display: block; }
  .avatar-camera-btn { position: absolute; bottom: -6px; right: -6px; width: 36px; height: 36px; border-radius: 999px; background: #2492EB; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; }
  .avatar-camera-btn:hover { background: #2492EB; }
  .avatar-info-name { font-weight: 700; color: #111; font-size: 1.0625rem; word-break: break-word; }
  .avatar-info-hint { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.2rem; }
  .avatar-actions { margin-top: 0.6rem; display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
  .avatar-upload-link { display: flex; align-items: center; gap: 0.4rem; background: none; border: none; color: #2492EB; font-weight: 700; font-size: 0.875rem; cursor: pointer; padding: 0; white-space: nowrap; }
  .avatar-upload-link:hover { text-decoration: underline; }
  .avatar-remove-link { background: none; border: none; color: #EF4444; font-weight: 700; font-size: 0.875rem; cursor: pointer; padding: 0; white-space: nowrap; }
  .avatar-remove-link:hover { text-decoration: underline; }
  .avatar-remove-link:disabled, .avatar-upload-link:disabled { opacity: 0.5; cursor: default; }

  .field-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; margin-top: 1rem; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.5rem; }
  .field-block { padding: 1.25rem 1.5rem; background: transparent; border-bottom: none; min-width: 0; }
  .field-block:not(.fullwidth) { border-bottom: none; }
  .field-block.fullwidth { grid-column: 1 / -1; }
  .field-label-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; flex-wrap: wrap; }
  .field-label-row svg { color: #6B7280; flex-shrink: 0; }
  .field-label { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .field-optional { font-size: 0.8125rem; color: #9CA3AF; font-weight: 500; }
  .field-required { color: #EF4444; }

  .field-input { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; font-family: inherit; }
  .field-input:focus { outline: none; border-color: #93C5FD; background: #fff; }
  .field-input.readonly { color: #6B7280; padding-right: 8.5rem; position: relative; }

  .email-row { position: relative; width: 100%; }
  .verified-badge { position: absolute; top: 50%; right: 0.85rem; transform: translateY(-50%); display: flex; align-items: center; gap: 0.3rem; background: #ECFDF5; color: #059669; font-size: 0.8125rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 999px; white-space: nowrap; }
  .field-hint { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.5rem; }

  .field-select { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; font-family: inherit; appearance: none; }
  .field-select:focus { outline: none; border-color: #93C5FD; background: #fff; }

  .field-textarea { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; font-family: inherit; resize: vertical; min-height: 110px; }
  .field-textarea:focus { outline: none; border-color: #93C5FD; background: #fff; }
  .char-count { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.4rem; text-align: right; }



   :root { --bottom-nav-h: 64px; }

  .profile-page-content { padding-bottom: calc(1rem + var(--bottom-nav-h)); }

  .save-bar {
    position: sticky;
    bottom: var(--bottom-nav-h);
    width: 100%;
    background: #fff;
    border-top: 1px solid #E5E7EB;
    padding: 1rem clamp(1rem, 4vw, 2.5rem) calc(1rem + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    z-index: 20;
    box-sizing: border-box;
  }
  .save-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; border-radius: 0.75rem; padding: 0.9rem 1.5rem; font-weight: 700; font-size: 0.9375rem; cursor: pointer; width: 100%; max-width: 480px; box-sizing: border-box; }
  .save-btn.primary { background: #2492EB; color: #fff; }
  .save-btn.primary:disabled { background: #E5E7EB; color: #9CA3AF; cursor: default; }
  .save-btn.secondary { background: #fff; color: #6B7280; border: 1px solid #E5E7EB; }
  .save-btn.secondary:disabled { color: #C4C9D1; cursor: default; }

  .toast { position: fixed; bottom: 6.5rem; left: 50%; transform: translateX(-50%); background: #1F2937; color: #fff; padding: 0.85rem 1.1rem; border-radius: 0.85rem; display: flex; align-items: center; gap: 0.7rem; font-size: 0.9rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.25); z-index: 400; max-width: 90vw; }
  .toast-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .toast-icon.success { background: #22C55E; }
  .toast-icon.error { background: #EF4444; }
  .toast-close { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0; display: flex; margin-left: 0.25rem; flex-shrink: 0; }
  .toast-close:hover { color: #fff; }

  @media (max-width: 640px) {
    .toast { bottom: 5.5rem; padding: 0.75rem 0.9rem; font-size: 0.85rem; }
    .save-bar { padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom)); }
    .field-card { grid-template-columns: 1fr; padding: 0; }
    .field-block { padding: 1rem; }
    .avatar-wrap { width: 72px; height: 72px; }
    .avatar-img { width: 72px; height: 72px; }
  }

  @media (max-width: 360px) {
    .avatar-actions { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  }

  /* Bottom-sheet (mobile) */
  .sheet-overlay { position: fixed; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,0,0,0.38); z-index: 60; }
  .sheet { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top-left-radius: 16px; border-top-right-radius: 16px; padding: 12px 16px calc(24px + env(safe-area-inset-bottom)); z-index: 70; box-shadow: 0 -8px 32px rgba(2,6,23,0.08); }
  .sheet-handle { width: 40px; height: 4px; background: #E5E7EB; border-radius: 4px; margin: 6px auto; }
  .sheet-title { text-align: center; font-weight: 700; margin: 8px 0 12px; }
  .sheet-option { display: flex; align-items: center; gap: 16px; width: 100%; padding: 14px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 10px; }
  .sheet-option:hover { background: #F9FAFB; }
  .sheet-option-icon { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sheet-option-icon svg { display: block; }
  .sheet-option-icon.icon-blue { background: #E6F0FF; color: #2492EB; }
  .sheet-option-icon.icon-purple { background: #F3E8FF; color: #8B5CF6; }
  .sheet-option .label { color: #0F172A; font-weight: 700; }
  .sheet-option .sub { color: #6B7280; font-size: 0.875rem; margin-top: 2px; font-weight: 500; }
  .sheet-cancel { width: 100%; margin-top: 12px; padding: 12px; border-radius: 10px; border: none; background: #fff; color: #EF4444; font-weight: 700; cursor: pointer; }

  /* Webcam modal (desktop "Take photo") */
  .webcam-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 80; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .webcam-modal { background: #111; border-radius: 1rem; overflow: hidden; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
  .webcam-header { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.1rem; background: #1F2937; }
  .webcam-title { color: #fff; font-weight: 700; font-size: 0.9375rem; }
  .webcam-close { background: none; border: none; color: #9CA3AF; cursor: pointer; display: flex; padding: 0.25rem; }
  .webcam-close:hover { color: #fff; }
  .webcam-video-wrap { position: relative; width: 100%; aspect-ratio: 4 / 3; background: #000; display: flex; align-items: center; justify-content: center; }
  .webcam-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: block; }
  .webcam-status { color: #9CA3AF; font-size: 0.875rem; text-align: center; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .webcam-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; background: #1F2937; }
  .webcam-shutter { width: 60px; height: 60px; border-radius: 999px; background: #fff; border: 4px solid #4B5563; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .webcam-shutter:hover { border-color: #6B7280; }
  .webcam-shutter:disabled { opacity: 0.5; cursor: default; }
  .webcam-cancel-btn { background: none; border: none; color: #9CA3AF; font-weight: 600; font-size: 0.875rem; cursor: pointer; padding: 0.5rem 0.75rem; }
  .webcam-cancel-btn:hover { color: #fff; }
`

const isMobileDevice = () =>
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function SettingsProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loadCurrentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const webcamVideoRef = useRef<HTMLVideoElement>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [original, setOriginal] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [webcamOpen, setWebcamOpen] = useState(false)
  const [webcamStarting, setWebcamStarting] = useState(false)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [webcamCapturing, setWebcamCapturing] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    window.clearTimeout((showToast as any)._t)
    ;(showToast as any)._t = window.setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<UserProfile>('/v1/auth/me/')
        setProfile(response.data)
        setOriginal(response.data)
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchProfile()
  }, [user])

  // Always stop the webcam stream on unmount, no matter how the modal closed.
  useEffect(() => {
    return () => {
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const isDirty = !!profile && !!original && (
    profile.first_name !== original.first_name ||
    profile.last_name !== original.last_name ||
    profile.phone !== original.phone ||
    profile.country !== original.country ||
    profile.bio !== original.bio
  )

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave() {
    if (!profile || !isDirty) return
    try {
      setSaving(true)
      setError(null)
      const response = await apiClient.patch<UserProfile>('/v1/auth/me/', {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        country: profile.country,
        bio: profile.bio,
      })
      setProfile(response.data)
      setOriginal(response.data)
      await loadCurrentUser()
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      setError('Failed to save changes. Please try again.')
      showToast('Failed to update profile. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (original) setProfile(original)
  }

  function handleAvatarClick() {
    setSheetOpen(true)
  }

  // Shared upload path used by both the native file/camera input and the
  // desktop webcam snapshot.
  async function uploadAvatarFile(file: File) {
    setAvatarError(null)

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Please choose a JPG or PNG image.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be 2MB or smaller.')
      return
    }

    try {
      setAvatarUploading(true)
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await apiClient.post<{ avatar_url: string }>('/v1/auth/me/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile((prev) => (prev ? { ...prev, avatar_url: response.data.avatar_url } : prev))
      setOriginal((prev) => (prev ? { ...prev, avatar_url: response.data.avatar_url } : prev))
      await loadCurrentUser()
      showToast('Photo updated', 'success')
    } catch (err) {
      setAvatarError('Upload failed. Please try again.')
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    setSheetOpen(false)
    if (!file) return
    await uploadAvatarFile(file)
  }

  function handleAvatarRemove() {
    if (!profile?.avatar_url) return
    setConfirmRemoveOpen(true)
  }

  async function confirmAvatarRemove() {
    setConfirmRemoveOpen(false)
    try {
      setAvatarUploading(true)
      setAvatarError(null)
      await apiClient.delete('/v1/auth/me/avatar/')
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev))
      setOriginal((prev) => (prev ? { ...prev, avatar_url: null } : prev))
      await loadCurrentUser()
      showToast('Profile photo removed', 'success')
    } catch (err) {
      const message = 'Could not remove photo. Please try again.'
      setAvatarError(message)
      showToast(message, 'error')
    } finally {
      setAvatarUploading(false)
    }
  }

  // On mobile, hand off to the OS camera app via the native capture input.
  // On desktop, open an in-page webcam modal since `capture` is ignored there.
  function openCameraInput() {
    setSheetOpen(false)
    if (isMobileDevice()) {
      setTimeout(() => cameraInputRef.current?.click(), 80)
    } else {
      openWebcamModal()
    }
  }

  function openFileInput() {
    setSheetOpen(false)
    setTimeout(() => fileInputRef.current?.click(), 80)
  }

  async function openWebcamModal() {
    setWebcamError(null)
    setWebcamOpen(true)
    setWebcamStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 540 } },
        audio: false,
      })
      webcamStreamRef.current = stream
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream
        await webcamVideoRef.current.play()
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setWebcamError('Camera access was denied. Allow camera access in your browser settings and try again.')
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setWebcamError('No camera was found on this device.')
      } else {
        setWebcamError('Could not access your camera. Please try again.')
      }
    } finally {
      setWebcamStarting(false)
    }
  }

  function closeWebcamModal() {
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop())
    webcamStreamRef.current = null
    setWebcamOpen(false)
    setWebcamError(null)
    setWebcamStarting(false)
  }

  async function captureWebcamPhoto() {
    const video = webcamVideoRef.current
    if (!video || !video.videoWidth) return

    setWebcamCapturing(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // Mirror the frame so the saved photo matches the (mirrored) preview.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      )
      if (!blob) throw new Error('Capture failed')

      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' })
      closeWebcamModal()
      await uploadAvatarFile(file)
    } catch (err) {
      setWebcamError('Could not capture photo. Please try again.')
    } finally {
      setWebcamCapturing(false)
    }
  }

  const bioLength = profile?.bio?.length ?? 0

  return (
    <>
      <style>{PAGE_CSS}</style>
      <SettingsLayout title="Profile" subtitle="Manage your personal information." backTo={ROUTES.SETTINGS}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Loading profile…</div>
        ) : error && !profile ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
        ) : profile && (
          <>
            {/* Avatar */}
            <div className="profile-card">
              <div className="avatar-row">
                <div className="avatar-wrap">
                  <img
                    src={profile.avatar_url || '/image1.png'}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="avatar-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/image1.png' }}
                  />
                  <button className="avatar-camera-btn" onClick={handleAvatarClick} disabled={avatarUploading} aria-label="Change photo">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <div className="avatar-info-name">{profile.first_name} {profile.last_name}</div>
                  <div className="avatar-info-hint">JPG or PNG · max 2 MB</div>
                  <div className="avatar-actions">
                    <button className="avatar-upload-link" onClick={handleAvatarClick} disabled={avatarUploading}>
                      <Camera size={15} /> {avatarUploading ? 'Uploading…' : 'Upload new photo'}
                    </button>
                    <button className="avatar-remove-link" onClick={handleAvatarRemove} disabled={avatarUploading || !profile.avatar_url}>
                      Remove
                    </button>
                  </div>
                  {avatarError && <div style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{avatarError}</div>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            {/* Fields */}
            <div className="field-card">
              <div className="field-block">
                <div className="field-label-row">
                  <User size={16} />
                  <span className="field-label">First name <span className="field-required">*</span></span>
                </div>
                <input
                  className="field-input"
                  type="text"
                  value={profile.first_name ?? ''}
                  onChange={(e) => updateField('first_name', e.target.value)}
                />
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <User size={16} />
                  <span className="field-label">Last name <span className="field-required">*</span></span>
                </div>
                <input
                  className="field-input"
                  type="text"
                  value={profile.last_name ?? ''}
                  onChange={(e) => updateField('last_name', e.target.value)}
                />
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <Mail size={16} />
                  <span className="field-label">Email address</span>
                </div>
                <div
                  className="email-row"
                  onClick={() => showToast('To change your email, contact support.', 'error')}
                  style={{ cursor: 'pointer' }}
                >
                  <input className="field-input readonly" type="email" value={profile.email ?? ''} readOnly disabled style={{ pointerEvents: 'none' }} />
                  {profile.is_email_verified && (
                    <span className="verified-badge"><CheckCircle2 size={13} /> Verified</span>
                  )}
                </div>
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <Phone size={16} />
                  <span className="field-label">Phone number</span>
                  <span className="field-optional">optional</span>
                </div>
                <input
                  className="field-input"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={profile.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <Globe size={16} />
                  <span className="field-label">Country / region</span>
                </div>
                <select
                  className="field-select"
                  value={profile.country ?? ''}
                  onChange={(e) => updateField('country', e.target.value || null)}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="field-block fullwidth">
                <div className="field-label-row">
                  <FileText size={16} />
                  <span className="field-label">Bio</span>
                  <span className="field-optional">optional</span>
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="Tell your trainer a little about yourself…"
                  maxLength={BIO_MAX_LEN}
                  value={profile.bio ?? ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                />
                <div className="char-count">{bioLength}/{BIO_MAX_LEN}</div>
              </div>
            </div>

            {error && <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.85rem' }}>{error}</div>}
          </>
        )}

        {/* Bottom-sheet modal for photo options */}
        {sheetOpen && (
          <>
            <div className="sheet-overlay" onClick={() => setSheetOpen(false)} />
            <div className="sheet" role="dialog" aria-label="Change profile photo">
              <div className="sheet-handle" />
              <div className="sheet-title">Change profile photo</div>
              <button className="sheet-option" onClick={openCameraInput}>
                <span className="sheet-option-icon icon-blue"><Camera size={18} /></span>
                <div>
                  <div className="label">Take photo</div>
                  <div className="sub">Use your camera to take a new photo</div>
                </div>
              </button>
              <button className="sheet-option" onClick={openFileInput}>
                <span className="sheet-option-icon icon-purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3H8L6 7H18L16 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg></span>
                <div>
                  <div className="label">Upload from photos</div>
                  <div className="sub">Choose from your photo library</div>
                </div>
              </button>
              <button className="sheet-cancel" onClick={() => setSheetOpen(false)}>Cancel</button>
            </div>
          </>
        )}

        {/* Bottom-sheet modal for confirming photo removal */}
        {confirmRemoveOpen && (
          <>
            <div className="sheet-overlay" onClick={() => setConfirmRemoveOpen(false)} />
            <div className="sheet" role="dialog" aria-label="Remove profile photo">
              <div className="sheet-handle" />
              <div className="sheet-title">Remove profile photo?</div>
              <button className="sheet-option" onClick={confirmAvatarRemove}>
                <span className="sheet-option-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
                  <X size={18} />
                </span>
                <div>
                  <div className="label" style={{ color: '#EF4444' }}>Remove photo</div>
                  <div className="sub">This can't be undone</div>
                </div>
              </button>
              <button className="sheet-cancel" onClick={() => setConfirmRemoveOpen(false)}>Cancel</button>
            </div>
          </>
        )}

        {/* Webcam modal (desktop "Take photo") */}
        {webcamOpen && (
          <div className="webcam-overlay" onClick={closeWebcamModal}>
            <div className="webcam-modal" role="dialog" aria-label="Take a photo" onClick={(e) => e.stopPropagation()}>
              <div className="webcam-header">
                <span className="webcam-title">Take photo</span>
                <button className="webcam-close" onClick={closeWebcamModal} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="webcam-video-wrap">
                {webcamError ? (
                  <div className="webcam-status">
                    <VideoOff size={28} />
                    <span>{webcamError}</span>
                  </div>
                ) : webcamStarting ? (
                  <div className="webcam-status">Starting camera…</div>
                ) : null}
                <video
                  ref={webcamVideoRef}
                  className="webcam-video"
                  autoPlay
                  playsInline
                  muted
                  style={{ display: webcamError || webcamStarting ? 'none' : 'block' }}
                />
              </div>

              <div className="webcam-controls">
                <button className="webcam-cancel-btn" onClick={closeWebcamModal}>Cancel</button>
                <button
                  className="webcam-shutter"
                  onClick={captureWebcamPhoto}
                  disabled={webcamStarting || !!webcamError || webcamCapturing}
                  aria-label="Capture photo"
                />
                <span style={{ width: '3.25rem' }} />
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className="toast" role="status">
            <span className={`toast-icon ${toast.type}`}>
              {toast.type === 'success' ? <Check size={13} color="#fff" /> : <AlertCircle size={13} color="#fff" />}
            </span>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
        {profile && (
          <div className="save-bar">
            <button className="save-btn primary" disabled={!isDirty || saving} onClick={handleSave}>
              <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="save-btn secondary" disabled={!isDirty || saving} onClick={handleCancel}>
              <X size={16} /> Cancel
            </button>
          </div>
        )}
      </SettingsLayout>
    </>
  )
}