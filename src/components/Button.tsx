import React, { useState } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  className = '',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}) => {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const baseStyles = 'font-sora rounded-lg font-medium transition-all focus:outline-none flex items-center gap-2 justify-center'

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: pressed ? '#1a6db5' : hovered ? '#1f7fd4' : 'var(--primary-500)',
      color: 'var(--white)',
    },
    secondary: {
      backgroundColor: pressed ? '#e6f0fa' : hovered ? '#f0f7ff' : 'var(--white)',
      color: 'var(--primary-500)',
      border: '2px solid var(--white)',
    },
    accent: {
      backgroundColor: pressed ? '#c5620a' : hovered ? '#d97315' : 'var(--accent-500)',
      color: 'var(--white)',
    },
    outline: {
      backgroundColor: pressed ? '#dbeeff' : hovered ? '#eef6ff' : 'var(--white)',
      color: 'var(--primary-500)',
      border: '2px solid var(--primary-500)',
    },
    ghost: {
      backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: 'var(--white)',
      border: '2px solid var(--white)',
    },
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    medium: { padding: '0.5rem 1.25rem', fontSize: '1rem' },
    large: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
  }

  const mergedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    transform: pressed ? 'scale(0.97)' : 'scale(1)',
    transition: 'background-color 150ms ease, transform 100ms ease, opacity 150ms ease',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  return (
    <button
      className={`${baseStyles} ${className}`}
      style={mergedStyle}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); onMouseLeave?.(e) }}
      onMouseDown={(e) => { setPressed(true); onMouseDown?.(e) }}
      onMouseUp={(e) => { setPressed(false); onMouseUp?.(e) }}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  )
}

export default Button