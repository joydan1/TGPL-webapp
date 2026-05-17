import React from 'react'
import { Mail, Lock, User } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  iconType?: 'email' | 'password' | 'username' | 'none'
  hint?: string
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  iconType = 'none',
  hint,
  className = '',
  style,
  ...props
}) => {
  const iconMap = {
    email: <Mail size={18} style={{ color: 'var(--grey)' }} />,
    password: <Lock size={18} style={{ color: 'var(--grey)' }} />,
    username: <User size={18} style={{ color: 'var(--grey)' }} />,
    none: null,
  }

  const hasIcon = iconType !== 'none'

  const inputStyle: React.CSSProperties = {
    paddingLeft: hasIcon ? '2.75rem' : '1rem',
    borderColor: error ? 'var(--danger)' : 'var(--grey)',
    borderWidth: error ? '2px' : '1px',
    borderStyle: 'solid',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--white)',
    color: 'var(--black)',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 200ms ease',
    ...style,
  }

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
            color: 'var(--black)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {hasIcon && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '1rem',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {iconMap[iconType]}
          </span>
        )}
        <input
          style={inputStyle}
          className={`focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p
          style={{
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            marginBottom: 0,
            color: 'var(--danger)',
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            fontSize: '0.875rem',
            marginTop: '0.25rem',
            marginBottom: 0,
            color: 'var(--grey)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default Input