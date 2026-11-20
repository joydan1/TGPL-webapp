export const PASSWORD_PLACEHOLDER = 'At least 8 characters'
export const PASSWORD_GUIDANCE = 'Use at least 8 characters, including at least one letter and one number.'

export function isPasswordValid(password: string): boolean {
  return password.length >= 8
    && /[A-Za-z]/.test(password)
    && /[0-9]/.test(password)
}

export function getPasswordError(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return PASSWORD_GUIDANCE
  return null
}