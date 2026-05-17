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
      icon: <Info size={16} strokeWidth={2.5} />,
      iconBgColor: '#DBEAFE',
      iconBorderColor: '#3B82F6',
    },
    success: {
      bgColor: '#F0FDF4',
      borderColor: '#86EFAC',
      textColor: '#166534',
      icon: <CheckCircle size={16} strokeWidth={2.5} />,
      iconBgColor: '#DCFCE7',
      iconBorderColor: '#22C55E',
    },
    warning: {
      bgColor: '#FFFBEB',
      borderColor: '#FCD34D',
      textColor: '#92400E',
      icon: <AlertCircle size={16} strokeWidth={2.5} />,
      iconBgColor: '#FEF3C7',
      iconBorderColor: '#F59E0B',
    },
    error: {
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
      textColor: '#991B1B',
      icon: <XCircle size={16} strokeWidth={2.5} />,
      iconBgColor: '#FECACA',
      iconBorderColor: '#DC2626',
    },
  }

  const colors = config[type]

  return (
    <div
      className={`rounded-xl p-4 mb-4 ${className}`}
      style={{
        backgroundColor: colors.bgColor,
        border: `1px solid ${colors.borderColor}`,
      }}
    >
      <div className="flex gap-3 items-flex-start">
        {/* Circular Icon Badge */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: '28px',
            height: '28px',
            minWidth: '28px',
            borderRadius: '50%',
            backgroundColor: colors.iconBgColor,
            border: `2px solid ${colors.iconBorderColor}`,
            color: colors.textColor,
            marginTop: '2px',
          }}
        >
          {React.cloneElement(colors.icon as React.ReactElement, {
            color: colors.textColor,
          })}
        </div>

        {/* Text Content */}
        <div className="flex-1">
          {title && (
            <h4
              className="font-bold text-sm mb-1"
              style={{ color: colors.textColor }}
            >
              {title}
            </h4>
          )}
          <p
            className="text-sm leading-relaxed"
            style={{ color: colors.textColor, margin: 0 }}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Alert