export default function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      style={{ animation: 'spin 0.7s linear infinite', width: size, height: size, flexShrink: 0, display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill="currentColor" style={{ opacity: 0.8 }} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}