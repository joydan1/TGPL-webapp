import { useAuthStore } from '../store/auth'
import { ROUTES } from '../constants/routes'
import type { UserMode } from '../types/index'

export interface ModeOption {
  key: UserMode
  label: string
  route: string
}

const MODE_CONFIG: Record<UserMode, { label: string; route: string }> = {
  admin:   { label: 'Continue as Admin',   route: ROUTES.ADMIN_DASHBOARD },
  trainer: { label: 'Continue as Trainer', route: ROUTES.TRAINER_DASHBOARD },
  learner: { label: 'Continue as Learner', route: ROUTES.DASHBOARD },
}

/**
 * Drives the mode switch in every shell.
 *
 * @param current the mode the calling shell represents ('admin' | 'trainer' | 'learner')
 * @returns options: the modes the user can switch *to* (current mode excluded)
 *          canSwitch: true only for admins, and only when the backend reports more than one mode
 *
 * Call this BEFORE any early `if (!user) return null` in the shell so hook order stays stable.
 */
export function useModeSwitch(current: UserMode) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const reportedModes = useAuthStore((s) => s.user?.available_modes)

  // Only admins can switch. Trainers and learners never get options, whatever the payload says.
  const modes = isAdmin ? (reportedModes ?? []) : []

  const options: ModeOption[] = modes
    .filter((m) => m !== current && m in MODE_CONFIG)
    .map((m) => ({ key: m, ...MODE_CONFIG[m] }))

  return {
    options,
    canSwitch: modes.length > 1 && options.length > 0,
  }
}