import React from 'react'
import { Mail, Phone } from 'lucide-react'

const Footer: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const el = document.getElementById(sectionId)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const navLinks = [
    { label: 'Home', sectionId: 'home' },
    { label: 'About', sectionId: 'about' },
    { label: 'Services', sectionId: 'services' },
    { label: 'Founder', sectionId: 'founder' },
    { label: 'Contact', sectionId: 'contact' },
    { label: 'Get Started', sectionId: 'get-started' },
  ]

  return (
    <footer style={{ backgroundColor: '#2c3e50', color: 'var(--white)', paddingTop: '3rem', paddingBottom: '2rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '2rem' }}>

        {/* Brand */}
        <div>
          <button onClick={() => scrollToSection('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <img src="/footerlogo.png" alt="TGPL Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </button>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem', color: '#b0c4de' }}>From blueprint to reality, we lead the way.</p>
        </div>

        {/* Navigation */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {navLinks.map((link) => (
              <li key={link.sectionId}>
                <button onClick={() => scrollToSection(link.sectionId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0c4de', fontSize: '0.95rem', padding: 0, transition: 'color 200ms ease', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'}
                  onMouseLeave={e => e.currentTarget.style.color = '#b0c4de'}
                >{link.label}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connect</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} color="var(--primary-500)" />
              <a href="mailto:theglobalprojectleaders@gmail.com" style={{ color: '#b0c4de', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 200ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'}
                onMouseLeave={e => e.currentTarget.style.color = '#b0c4de'}>
                theglobalprojectleaders@gmail.com
              </a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} color="var(--primary-500)" />
              <a href="tel:+2348088044739" style={{ color: '#b0c4de', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 200ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'}
                onMouseLeave={e => e.currentTarget.style.color = '#b0c4de'}>
                +234 808 804 4739
              </a>
            </li>

            <li style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

            <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a href="https://instagram.com/theglobalprojectleaders" target="_blank" rel="noopener noreferrer"
                style={{ color: '#b0c4de', textDecoration: 'none', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 200ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'}
                onMouseLeave={e => e.currentTarget.style.color = '#b0c4de'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="var(--primary-500)" stroke="none" />
                </svg>
                @theglobalprojectleaders
              </a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a href="https://linkedin.com/company/the-global-project-leaders" target="_blank" rel="noopener noreferrer"
                style={{ color: '#b0c4de', textDecoration: 'none', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'color 200ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'}
                onMouseLeave={e => e.currentTarget.style.color = '#b0c4de'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--primary-500)" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                The Global Project Leaders
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#b0c4de' }}>
        <p>© {new Date().getFullYear()} The Global Project Leaders (TGPL). All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer