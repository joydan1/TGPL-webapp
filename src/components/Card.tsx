import React from 'react'

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--white)',
      border: '1px solid var(--grey)',
      borderRadius: 'var(--radius-lg)',
    },
    elevated: {
      backgroundColor: 'var(--white)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    },
    outlined: {
      backgroundColor: 'var(--white)',
      border: '2px solid var(--primary-500)',
      borderRadius: 'var(--radius-lg)',
    },
  }

  return (
    <div className={className} style={variantStyles[variant]}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderBottom: '1px solid var(--grey)',
    }}
  >
    {children}
  </div>
)

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
    }}
  >
    {children}
  </div>
)

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderTop: '1px solid var(--grey)',
      backgroundColor: 'var(--grey)',
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)',
    }}
  >
    {children}
  </div>
)

export { Card, CardHeader, CardBody, CardFooter }
export default Card