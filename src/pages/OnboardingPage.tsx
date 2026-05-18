// OnboardingPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { RouteBuilder } from '../constants/routes'
import {
  Target, TrendingUp, Briefcase, GraduationCap, Compass,
  CheckSquare, Wrench, MessageCircle, ChevronDown
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4

interface OnboardingData {
  goals: string[]
  interests: string[]
  experienceLevel: string
  currentStatus: string
  learningHours: string
}

// ── Step dots ──────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 4,
              background: i < current ? 'var(--primary-500)' : '#D1D5DB',
              width: i === current - 1 ? 32 : 10,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Step {current} of {total}</span>
    </div>
  )
}

// ── List option (Step 1) ───────────────────────────────────────────────────
function ListOption({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: selected ? '2px solid var(--primary-500)' : '1.5px solid #E5E7EB',
        background: selected ? '#EFF6FF' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: selected ? 'var(--primary-500)' : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selected ? '#fff' : '#6B7280',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 500, color: selected ? 'var(--primary-500)' : '#111827' }}>
          {label}
        </span>
      </div>
      {selected && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  )
}

// ── Grid option (Step 2) ───────────────────────────────────────────────────
function GridOption({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1.5rem 1rem',
        borderRadius: '12px',
        border: selected ? '2px solid var(--primary-500)' : '1.5px solid #E5E7EB',
        background: selected ? '#EFF6FF' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        minHeight: 130,
      }}
    >
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: selected ? 'var(--primary-500)' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: selected ? '#fff' : '#6B7280',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          color: selected ? 'var(--primary-500)' : '#111827',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </button>
  )
}

// ── Select dropdown ────────────────────────────────────────────────────────
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            appearance: 'none',
            padding: '0.875rem 2.5rem 0.875rem 1rem',
            borderRadius: '12px',
            border: '1.5px solid #E5E7EB',
            background: '#fff',
            fontSize: '1rem',
            color: value ? '#111827' : '#9CA3AF',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        >
          <option value="" disabled>
            {options[0]?.label}
          </option>
          {options.slice(1).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
 const firstName = user?.name?.split(' ')[0] || 'there'

  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    interests: [],
    experienceLevel: '',
    currentStatus: '',
    learningHours: '',
  })

  const skipOrFinish = () => {
    // Mark as skipped (incomplete) so it shows again next login
    localStorage.setItem('onboardingSkipped', 'true')
    navigate(RouteBuilder.dashboard())
  }

  const completeOnboarding = () => {
    // Save answers and mark as complete
    localStorage.setItem('onboardingComplete', 'true')
    localStorage.setItem('onboardingData', JSON.stringify(data))
    localStorage.removeItem('onboardingSkipped')
    setStep(4)
  }

  const toggleGoal = (goal: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const goals = [
    { id: 'land-pm', label: 'Land a PM role', icon: <Target size={18} /> },
    { id: 'switch-careers', label: 'Switch careers', icon: <TrendingUp size={18} /> },
    { id: 'upskill', label: 'Upskill in current role', icon: <Briefcase size={18} /> },
    { id: 'academic', label: 'Academic learning', icon: <GraduationCap size={18} /> },
    { id: 'explore', label: 'Explore the field', icon: <Compass size={18} /> },
  ]

  const interests = [
    { id: 'pm-all', label: 'Project Management\n(All inclusive)', icon: <CheckSquare size={20} /> },
    { id: 'pm-only', label: 'Project Management only', icon: <Wrench size={20} /> },
    { id: 'tools', label: 'Tools (Jira/MS Project)', icon: <Wrench size={20} /> },
    { id: 'soft-skills', label: 'Soft Skills', icon: <MessageCircle size={20} /> },
  ]

  const experienceOptions = [
    { value: '', label: '(Select level)' },
    { value: 'beginner', label: 'Beginner- No prior experience' },
    { value: 'basic', label: 'Basic - Some exposure/training' },
    { value: 'intermediate', label: 'Intermediate - 1-3 years of experience' },
  ]

  const statusOptions = [
    { value: '', label: '(Select status)' },
    { value: 'student', label: 'Student' },
    { value: 'working', label: 'Working' },
    { value: 'freelance', label: 'Freelancer' },
    { value: 'job-seeking', label: 'Job Seeking' },
    { value: 'career break', label: 'Career break' },
  ]

  const hoursOptions = [
    { value: '', label: '(Select hours)' },
    { value: '1-3', label: '1–3 hours' },
    { value: '4-6', label: '4–6 hours' },
    { value: '7-10', label: '7–10 hours' },
    { value: '10+', label: '10+ hours' },
  ]

  // ── Shared layout wrapper ────────────────────────────────────────────────
  const Layout = ({ children, showSkip = true }: { children: React.ReactNode; showSkip?: boolean }) => (
    <div style={{ minHeight: '100vh', background: 'var(--grey)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem' }}>
        <img src="/Logo.png" alt="TGPL" style={{ height: '2.5rem' }} />
        {showSkip && (
          <button
            type="button"
            onClick={skipOrFinish}
            style={{ background: 'none', border: 'none', color: 'var(--primary-500)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 1.5rem 2rem' }}>
        {children}
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', padding: '1.5rem' }}>
        Join 50,000+ learners building their project management careers
      </p>
    </div>
  )

  // ── Step 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Layout>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <StepIndicator current={1} total={3} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Welcome, {firstName}<br />What brings you to TGPL?
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>Select all that apply to personalize your learning journey</p>
          </div>

          {goals.map((g) => (
            <ListOption
              key={g.id}
              icon={g.icon}
              label={g.label}
              selected={data.goals.includes(g.id)}
              onClick={() => toggleGoal(g.id)}
            />
          ))}

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={data.goals.length === 0}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: data.goals.length > 0 ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: data.goals.length > 0 ? 'pointer' : 'not-allowed',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            Continue 
          </button>
        </div>
      </Layout>
    )
  }

  // ── Step 2 ───────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Layout>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <StepIndicator current={2} total={3} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Which areas interest you most?
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>Choose topics you'd like to focus on in your learning path</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {interests.map((item) => (
              <GridOption
                key={item.id}
                icon={item.icon}
                label={item.label}
                selected={data.interests.includes(item.id)}
                onClick={() => toggleInterest(item.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={data.interests.length === 0}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: data.interests.length > 0 ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: data.interests.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            Continue →
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{ width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: '1rem', marginTop: '0.75rem', cursor: 'pointer', padding: '0.5rem' }}
          >
            Back
          </button>
        </div>
      </Layout>
    )
  }

  // ── Step 3 ───────────────────────────────────────────────────────────────
  if (step === 3) {
    const isValid = data.experienceLevel && data.currentStatus && data.learningHours
    return (
      <Layout>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <StepIndicator current={3} total={3} />
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Tell us about yourself
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>Help us tailor your learning experience to your needs</p>
          </div>

          <SelectField
            label="Project management experience level"
            value={data.experienceLevel}
            onChange={(v) => setData((prev) => ({ ...prev, experienceLevel: v }))}
            options={experienceOptions}
          />
          <SelectField
            label="Current Status"
            value={data.currentStatus}
            onChange={(v) => setData((prev) => ({ ...prev, currentStatus: v }))}
            options={statusOptions}
          />
          <SelectField
            label="Preferred Learning Hours Per Week"
            value={data.learningHours}
            onChange={(v) => setData((prev) => ({ ...prev, learningHours: v }))}
            options={hoursOptions}
          />

          <button
            type="button"
            onClick={completeOnboarding}
            disabled={!isValid}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: isValid ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              marginTop: '0.5rem',
            }}
          >
            Finish setup
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            style={{ width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: '1rem', marginTop: '0.75rem', cursor: 'pointer', padding: '0.5rem' }}
          >
            Back
          </button>
        </div>
      </Layout>
    )
  }

  // ── Step 4 — Success ─────────────────────────────────────────────────────
  return (
    <Layout showSkip={false}>
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          background: '#fff',
          borderRadius: '20px',
          padding: '5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😎</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          You are all set!
        </h1>
        <p style={{ color: '#6B7280', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Really glad to have you here!<br />
          click on the button below to proceed to your dashboard
        </p>
        <button
          type="button"
          onClick={() => navigate(RouteBuilder.dashboard())}
          style={{
            padding: '0.9rem 2.5rem',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--primary-500)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            minWidth: '260px',
          }}
        >
          Go to dashboard
        </button>
      </div>
    </Layout>
  )
}