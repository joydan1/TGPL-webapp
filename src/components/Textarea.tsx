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
  style,
  ...props
}) => {
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--grey)'}`,
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--white)',
    color: 'var(--black)',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: 'all 200ms ease',
    ...style,
  }

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--black)',
            marginBottom: '0.5rem',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        style={textareaStyle}
        className={`focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--danger)',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--grey)',
            marginTop: '0.25rem',
            marginBottom: 0,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default Textarea