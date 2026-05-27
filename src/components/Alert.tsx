import React from 'react'
import { Info, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const config = {
    info: {
      bgColor: '#EFF6FF',
      borderColor: '#93C5FD',
      textColor: '#1E40AF',
      icon: <Info size={18} strokeWidth={2.5} />,
    },
    success: {
      bgColor: '#F0FDF4',
      borderColor: '#86EFAC',
      textColor: '#166534',
      icon: <CheckCircle size={18} strokeWidth={2.5} />,
    },
    warning: {
      bgColor: '#FFFBEB',
      borderColor: '#FCD34D',
      textColor: '#92400E',
      icon: <AlertCircle size={18} strokeWidth={2.5} />,
    },
    error: {
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
      textColor: '#991B1B',
      icon: <XCircle size={18} strokeWidth={2.5} />,
    },
  }

  const colors = config[type]

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.bgColor,
        border: `1px solid ${colors.borderColor}`,
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Icon — no badge, just the icon itself */}
        <div
          style={{
            flexShrink: 0,
            color: colors.textColor,
            marginTop: '1px',
            display: 'flex',
          }}
        >
          {React.cloneElement(colors.icon as React.ReactElement, {
            color: colors.textColor,
          })}
        </div>

        {/* Text content */}
        <div style={{ flex: 1 }}>
          {title && (
            <h4
              style={{
                color: colors.textColor,
                fontWeight: 700,
                fontSize: '0.875rem',
                margin: '0 0 0.25rem 0',
                lineHeight: 1.4,
              }}
            >
              {title}
            </h4>
          )}
          <div
            style={{
              color: colors.textColor,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alert