import { useState } from 'react'
import { Search, Plus, Minus, Zap, CreditCard, ShieldCheck, BookOpen } from 'lucide-react'
import SettingsLayout from '../../components/layout/SettingsLayout'

type FaqItem = { id: string; question: string; answer: string; category: string }

const CATEGORIES = [
  { id: 'gettingStarted', label: 'Getting started', icon: Zap },
  { id: 'payments', label: 'Payments & enrollment', icon: CreditCard },
  { id: 'account', label: 'Account & security', icon: ShieldCheck },
  { id: 'courses', label: 'Courses & certificates', icon: BookOpen },
]

const FAQS: FaqItem[] = [
  {
    id: 'reset-password',
    question: 'How to reset my password',
    answer: 'Go to Settings > Security and enter your current password along with a new one to update it.',
    category: 'account',
  },
  {
    id: 'refund',
    question: 'Can I get a refund after enrolling?',
    answer: 'Refund eligibility depends on how much of the course you have completed. Contact support for a review.',
    category: 'payments',
  },
  {
    id: 'certificate',
    question: 'When do I get my certificate?',
    answer: 'Your certificate is issued automatically once you complete all modules, submit all assignments and your final project, and pass the required marks.',
    category: 'courses',
  },
  {
    id: 'check-courses',
    question: 'How do I check my courses?',
    answer: 'Open the Courses tab from the sidebar to see everything you are enrolled in, along with your progress.',
    category: 'gettingStarted',
  },
]

const PAGE_CSS = `
  .help-card { max-width: 900px; margin: 1.5rem auto 0; }
  .help-search { position: relative; margin-bottom: 1.5rem; }
  .help-search input { width: 100%; box-sizing: border-box; padding: 0.9rem 1rem 0.9rem 2.75rem; border-radius: 0.75rem; border: 1px solid #E5E7EB; background: #F9FAFB; font-size: 0.9375rem; }
  .help-search .icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
  .help-categories { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
  .help-cat-btn { display: flex; align-items: center; gap: 0.5rem; justify-content: center; padding: 0.85rem 1rem; border-radius: 0.75rem; border: 1px solid #E5E7EB; background: #fff; font-weight: 600; font-size: 0.875rem; color: #111; cursor: pointer; }
  .help-cat-btn.active { border-color: #2563EB; color: #2563EB; background: #EFF6FF; }
  .help-faq-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; }
  .help-faq-row { border-top: 1px solid #F3F4F6; }
  .help-faq-row:first-child { border-top: none; }
  .help-faq-question { display: flex; align-items: center; justify-content: space-between; width: 100%; background: none; border: none; padding: 1.1rem 1.5rem; text-align: left; cursor: pointer; font-size: 0.9375rem; color: #111; font-weight: 500; }
  .help-faq-answer { padding: 0 1.5rem 1.1rem; color: #6B7280; font-size: 0.875rem; line-height: 1.6; margin: 0; }
  .help-faq-icon { flex-shrink: 0; border: 1px solid #D1D5DB; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #6B7280; }
  .help-support-card { margin-top: 1.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .help-support-title { font-weight: 700; font-size: 1rem; color: #111; margin: 0; }
  .help-support-sub { font-size: 0.875rem; color: #6B7280; margin: 0.25rem 0 0; }
  .help-chat-btn { background: #2563EB; color: #fff; border: none; padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .help-empty { padding: 2rem 1.5rem; text-align: center; color: #6B7280; font-size: 0.9375rem; }
  @media (max-width:768px){
    .help-categories { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width:640px){
    .help-support-card { flex-direction: column; align-items: flex-start; }
    .help-chat-btn { width: 100%; }
  }
`

export default function HelpSupportPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>('certificate')

  const filtered = FAQS.filter((f) => {
    const matchesCategory = !activeCategory || f.category === activeCategory
    const matchesQuery = !query.trim() || f.question.toLowerCase().includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  })

  const handleChatWithUs = () => {
    // No support-chat/ticket endpoint exists yet.
    // Hook this up once live chat or a ticketing endpoint is available.
    window.open('mailto:support@tgpl.example.com', '_blank')
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <SettingsLayout title="Help & Support" subtitle="Find answers & reach-out to the team">
        <div className="help-card">
          <div className="help-search">
            <Search size={18} className="icon" />
            <input
              type="text"
              placeholder="Search articles"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="help-categories">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`help-cat-btn${isActive ? ' active' : ''}`}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          <div className="help-faq-card">
            {filtered.length === 0 && (
              <div className="help-empty">No articles match your search.</div>
            )}
            {filtered.map((faq) => {
              const isOpen = openId === faq.id
              return (
                <div className="help-faq-row" key={faq.id}>
                  <button
                    type="button"
                    className="help-faq-question"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                  >
                    {faq.question}
                    <span className="help-faq-icon">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>
                  {isOpen && <p className="help-faq-answer">{faq.answer}</p>}
                </div>
              )
            })}
          </div>

          <div className="help-support-card">
            <div>
              <p className="help-support-title">Still need help?</p>
              <p className="help-support-sub">We typically reply within 24 hours</p>
            </div>
            <button type="button" className="help-chat-btn" onClick={handleChatWithUs}>
              Chat with us
            </button>
          </div>
        </div>
      </SettingsLayout>
    </>
  )
}