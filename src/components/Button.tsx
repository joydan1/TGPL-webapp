import React from 'react'

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
  ...props
}) => {
  const baseStyles = 'font-sora rounded-lg font-medium transition-all focus:outline-none flex items-center gap-2 justify-center'

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary-500)',
      color: 'var(--white)',
    },
    secondary: {
      backgroundColor: 'var(--white)',
      color: 'var(--black)',
      border: '2px solid var(--black)',
    },
    accent: {
      backgroundColor: 'var(--accent-500)',
      color: 'var(--white)',
    },
    outline: {
      backgroundColor: 'var(--white)',
      color: 'var(--primary-500)',
      border: '2px solid var(--primary-500)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--primary-500)',
    },
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    medium: { padding: '0.5rem 1rem', fontSize: '1rem' },
    large: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
  }

  const disabledStyles: React.CSSProperties = props.disabled
    ? { opacity: 0.5, cursor: 'not-allowed' }
    : {}

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </>
  )

  const mergedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...disabledStyles,
    ...style,
  }

  return (
    <button
      className={`${baseStyles} ${className}`}
      style={mergedStyle}
      {...props}
    >
      {content}
    </button>
  )
}

export default Button