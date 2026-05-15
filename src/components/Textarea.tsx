import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 border rounded-lg bg-grey text-black placeholder-grey
          focus:outline-none focus:ring-2 focus:ring-primary-500
          disabled:bg-grey disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-grey'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-grey mt-1">{hint}</p>
      )}
    </div>
  )
}

export default Textarea