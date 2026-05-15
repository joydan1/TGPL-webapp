import React from 'react'

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ variant = 'default', children, className = '' }) => {
  const variantStyles = {
    default: 'bg-white border border-grey rounded-lg',
    elevated: 'bg-white rounded-lg shadow-md',
    outlined: 'bg-white border-2 border-primary-500 rounded-lg',
  }

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-grey ${className}`}>
    {children}
  </div>
)

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-grey bg-grey rounded-b-lg ${className}`}>
    {children}
  </div>
)

export { Card, CardHeader, CardBody, CardFooter }
export default Card