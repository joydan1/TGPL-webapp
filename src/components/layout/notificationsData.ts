// ─────────────────────────────────────────────────────────────────────────────
// Shared data layer for notifications.
// When the real API exists, replace NOTIFICATIONS with an API call and remove
// this file — both NotificationPanel and NotificationsPage import from here.
// ─────────────────────────────────────────────────────────────────────────────

export type NotifCategory =
  | 'all'
  | 'deadlines'
  | 'live'
  | 'bookings'
  | 'feedback'
  | 'certificate'
  | 'system'

export interface Notification {
  id: number
  category: Exclude<NotifCategory, 'all'>
  title: string
  sub: string
  time: string
  unread: boolean
  iconBg: string
  isNew: boolean
}

export const NOTIFICATIONS: Notification[] = [
  { id: 1,  category: 'certificate', title: "You're 60% to your certificate",       sub: 'Complete 2 more modules and your project submission to unlock your PM certificate.',  time: '5h ago',      unread: true,  iconBg: '#FEF9EC', isNew: true  },
  { id: 2,  category: 'feedback',    title: 'Your submission has been graded',       sub: 'Amara Osei graded your Scope Planning Quiz — you scored 84/100. Great work!',         time: '3h ago',      unread: true,  iconBg: '#ECFDF5', isNew: true  },
  { id: 3,  category: 'live',        title: 'Live session starting soon',            sub: "Q&A: Stakeholder Communication in Practice starts in 1 hour. Don't miss it.",         time: '2h ago',      unread: true,  iconBg: '#FEF2F2', isNew: true  },
  { id: 4,  category: 'deadlines',   title: 'Assignment missed',                    sub: 'Stakeholder Map Project for Project Management has not been done.',                     time: '1h ago',      unread: true,  iconBg: '#FEF2F2', isNew: true  },
  { id: 5,  category: 'bookings',    title: 'Tutor session confirmed',               sub: 'Your 1-on-1 with Amara Osei is confirmed for Thu, 5 Jun at 10:00 AM WAT.',            time: 'Yesterday',   unread: false, iconBg: '#EFF6FF', isNew: false },
  { id: 6,  category: 'deadlines',   title: 'Assignment missed',                    sub: 'Leadership Reflection Essay for Leadership Essentials has not been done.',             time: 'Yesterday',   unread: false, iconBg: '#FEF2F2', isNew: false },
  { id: 7,  category: 'live',        title: 'New live session scheduled',            sub: 'Masterclass: Critical Path Method Deep Dive is scheduled for Wed, 4 Jun at 2:00 PM.', time: '2 days ago',  unread: false, iconBg: '#FEF2F2', isNew: false },
  { id: 8,  category: 'system',      title: 'New module unlocked',                  sub: 'Module 6 — Risk Management is now available in your Project Management course.',       time: '2 days ago',  unread: false, iconBg: '#F3F4F6', isNew: false },
  { id: 9,  category: 'feedback',    title: 'Revision requested on your submission', sub: 'Amara Osei has requested changes to your Stakeholder Map Project. Please review.',    time: '3 days ago',  unread: false, iconBg: '#ECFDF5', isNew: false },
  { id: 10, category: 'certificate', title: 'Certificate ready for download',        sub: 'Your certificate of completion for Data Storytelling is now available.',              time: '1 week ago',  unread: false, iconBg: '#FEF9EC', isNew: false },
  { id: 11, category: 'bookings',    title: 'Upcoming tutor session reminder',       sub: 'Your session with Bola Adeyinka is tomorrow at 10:00 AM WAT. A link will be sent.',   time: '1 week ago',  unread: false, iconBg: '#EFF6FF', isNew: false },
  { id: 12, category: 'system',      title: 'Welcome to TGPL!',                     sub: 'Your account is set up. Explore your enrolled courses and start learning today.',      time: '2 weeks ago', unread: false, iconBg: '#F3F4F6', isNew: false },
]

export const TABS: { key: NotifCategory; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'deadlines',   label: 'Assignments' },
  { key: 'live',        label: 'Live'        },
  { key: 'bookings',    label: 'Bookings'    },
  { key: 'feedback',    label: 'Feedback'    },
  { key: 'certificate', label: 'Certificate' },
  { key: 'system',      label: 'System'      },
]

/** Returns unread counts for every tab key */
export function tabCounts(
  notifications: Notification[],
): Record<NotifCategory, number> {
  return TABS.reduce((acc, t) => {
    acc[t.key] =
      t.key === 'all'
        ? notifications.filter(n => n.unread).length
        : notifications.filter(n => n.category === t.key && n.unread).length
    return acc
  }, {} as Record<NotifCategory, number>)
}