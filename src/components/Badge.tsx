import React from 'react'

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className = '' }) => {
  const variantStyles = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-black text-white',
    accent: 'bg-accent-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-400 text-black',
    danger: 'bg-red-500 text-white',
  }

  return (
    <span
      className={`
        inline-block px-3 py-1 rounded-full text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge
