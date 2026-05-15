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
  const defaultStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-100',
    secondary: 'bg-white text-black border-2 border-black hover:bg-grey focus:ring-2 focus:ring-grey',
    accent: 'bg-accent-500 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-100',
    outline: 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50 focus:ring-2 focus:ring-primary-100',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 focus:ring-2 focus:ring-primary-100',
  }

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  }

  const disabledStyles = props.disabled ? 'opacity-50 cursor-not-allowed' : ''

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </>
  )

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      style={{ ...defaultStyle, ...style }}
      {...props}
    >
      {content}
    </button>
  )
}

export default Button