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
    email:    <Mail size={18} style={{ color: '#999999' }} />,
    password: <Lock size={18} style={{ color: '#999999' }} />,
    username: <User size={18} style={{ color: '#999999' }} />,
    none: null,
  }

  const hasIcon = iconType !== 'none'

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--black)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <span
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: '1rem' }}      
          >
            {iconMap[iconType]}
          </span>
        )}
        <input
          style={{
            
            paddingLeft: hasIcon ? '2.75rem' : '1rem',
            // Error state overrides border colour
            borderColor: error ? 'var(--danger)' : undefined,
            borderWidth: error ? '2px' : undefined,
            backgroundColor: error ? 'var(--white)' : undefined,
            ...style,
          }}
          className={`
            focus:outline-none focus:ring-2 focus:ring-primary-500
            disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--danger)', marginBottom: 0 }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          className="text-sm mt-1"
          style={{ color: '#999999', marginBottom: 0 }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default Input