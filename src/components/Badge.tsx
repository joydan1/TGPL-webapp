import React from 'react'

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className = '' }) => {
  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-500)',
      color: 'var(--white)',
    },
    secondary: {
      backgroundColor: 'var(--black)',
      color: 'var(--white)',
    },
    accent: {
      backgroundColor: 'var(--accent-500)',
      color: 'var(--white)',
    },
    success: {
      backgroundColor: 'var(--success)',
      color: 'var(--white)',
    },
    warning: {
      backgroundColor: 'var(--warning)',
      color: 'var(--black)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: 'var(--white)',
    },
  }

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  )
}

export default Badge