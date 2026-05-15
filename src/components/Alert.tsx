import React from 'react'
import { Info, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

const Alert: React.FC<AlertProps> = ({ type = 'info', title, children, className = '' }) => {
  const typeStyles = {
    info:    'bg-blue-50 border-l-4 border-primary-500 text-primary-700',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-700',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700',
    error:   'bg-red-50 border-l-4 border-red-500 text-red-700',
  }

  const textColor = {
    info:    '#1A7ACC',
    success: '#15803d',
    warning: '#a16207',
    error:   '#b91c1c',
  }

  const iconMap = {
    info:    <Info size={20} className="text-primary-500" />,
    success: <CheckCircle size={20} className="text-green-500" />,
    warning: <AlertCircle size={20} className="text-yellow-600" />,
    error:   <XCircle size={20} className="text-red-500" />,
  }

  return (
    <div
      className={`rounded-lg p-4 mb-4 ${typeStyles[type]} ${className}`}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          {iconMap[type]}
        </div>
        <div className="flex-1">
          {title && (
            <h4
              className="font-bold mb-1"
              
              style={{ color: textColor[type] }}
            >
              {title}
            </h4>
          )}
          {/* global p { color: white } — must override with inline style */}
          <p className="text-sm" style={{ color: textColor[type], marginBottom: 0 }}>
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Alert