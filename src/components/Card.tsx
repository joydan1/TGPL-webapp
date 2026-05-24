import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({ variant = 'default', children, className = '', style, ...rest }) => {
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
    <div className={className} style={{ ...variantStyles[variant], ...style }} {...rest}>
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderBottom: '1px solid var(--grey)',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const CardBody: React.FC<CardBodyProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', style, ...rest }) => (
  <div
    className={className}
    style={{
      padding: '1.5rem',
      borderTop: '1px solid var(--grey)',
      backgroundColor: 'var(--grey)',
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

export { Card, CardHeader, CardBody, CardFooter }
export default Card