
import type { ApiNotification } from '../../services/api'

export type NotifCategory =
  | 'all'
  | 'deadlines'
  | 'live'
  | 'bookings'
  | 'feedback'
  | 'certificate'
  | 'system'

export interface Notification {
  id: string
  category: Exclude<NotifCategory, 'all'>
  title: string
  sub: string
  time: string
  unread: boolean
  iconBg: string
  actionUrl: string | null
}

export const TABS: { key: NotifCategory; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'deadlines',   label: 'Assignments' },
  { key: 'live',        label: 'Live'        },
  { key: 'bookings',    label: 'Bookings'    },
  { key: 'feedback',    label: 'Feedback'    },
  { key: 'certificate', label: 'Certificate' },
  { key: 'system',      label: 'System'      },
]

const ICON_BG: Record<Exclude<NotifCategory, 'all'>, string> = {
  certificate: '#FEF9EC',
  feedback:    '#ECFDF5',
  live:        '#FEF2F2',
  deadlines:   '#FEF2F2',
  bookings:    '#EFF6FF',
  system:      '#F3F4F6',
}

// Best-effort mapping from backend `type` strings (e.g. "CERTIFICATE_ISSUED",
// "ASSIGNMENT_GRADED_PASS") to a display category. Order matters — first
// match wins. Adjust/extend once the real set of `type` values is confirmed;
// anything unmatched falls through to 'system' rather than erroring.
const CATEGORY_RULES: { category: Exclude<NotifCategory, 'all'>; pattern: RegExp }[] = [
  { category: 'certificate', pattern: /CERTIFICATE/i },
  { category: 'feedback',    pattern: /GRAD|FEEDBACK|REVISION/i },
  { category: 'deadlines',   pattern: /ASSIGNMENT|DEADLINE/i },
  { category: 'live',        pattern: /LIVE|SESSION/i },
  { category: 'bookings',    pattern: /BOOKING/i },
]

function categoryFromType(type: string): Exclude<NotifCategory, 'all'> {
  const rule = CATEGORY_RULES.find((r) => r.pattern.test(type))
  return rule ? rule.category : 'system'
}

/** "5 minutes ago" / "2h ago" / "Yesterday" / "3 days ago" / locale date fallback */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString()
}

export function mapApiNotification(n: ApiNotification): Notification {
  const category = categoryFromType(n.type)
  return {
    id: n.id,
    category,
    title: n.title,
    sub: n.body,
    time: formatRelativeTime(n.created_at),
    unread: !n.is_read,
    iconBg: ICON_BG[category],
    actionUrl: n.action_url,
  }
}

/** Returns unread counts for every tab key */
export function tabCounts(notifications: Notification[]): Record<NotifCategory, number> {
  return TABS.reduce((acc, t) => {
    acc[t.key] =
      t.key === 'all'
        ? notifications.filter((n) => n.unread).length
        : notifications.filter((n) => n.category === t.key && n.unread).length
    return acc
  }, {} as Record<NotifCategory, number>)
}