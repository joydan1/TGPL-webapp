import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { ROUTES } from '../constants/routes'

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Home', sectionId: 'home' },
    { label: 'About', sectionId: 'about' },
    { label: 'Services', sectionId: 'services' },
    { label: 'Founder', sectionId: 'founder' },
    { label: 'Contact', sectionId: 'contact' },
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    setMobileMenuOpen(false)

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const el = document.getElementById(sectionId)
    if (el) {
      const headerOffset = 72
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // ✅ Scroll spy (updates active section on scroll)
  useEffect(() => {
    const handleScroll = () => {
      let current = 'home'

      for (const link of navLinks) {
        const el = document.getElementById(link.sectionId)
        if (!el) continue

        const rect = el.getBoundingClientRect()
        if (rect.top <= 120) {
          current = link.sectionId
        }
      }

      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      style={{
        backgroundColor: 'var(--white)',
        borderBottom: '1px solid var(--grey)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <nav
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Logo */}
<<<<<<< HEAD
        <button onClick={() => scrollToSection('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
          <img src="/ICON.png" alt="TGPL Logo" style={{ height: '40px', objectFit: 'contain' }} />
=======
        <button
          onClick={() => scrollToSection('home')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: 0
          }}
        >
          <img src="/ICON.png" alt="TGPL Logo" style={{ height: '40px' }} />
>>>>>>> 1a617c6a3bc1483648974dd9eed82a04851fdce6
        </button>

        {/* Desktop Nav */}
        <div style={{ gap: '2rem', alignItems: 'center' }} className="hidden md:flex">
          {navLinks.map((link) => {
            const active = activeSection === link.sectionId

            return (
              <button
                key={link.sectionId}
                onClick={() => scrollToSection(link.sectionId)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: active ? 'var(--primary-500)' : 'var(--black)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderBottom: active
                    ? '2px solid var(--primary-500)'
                    : '2px solid transparent',
                  padding: '0 0 0.25rem 0'
                }}
              >
                {link.label}
              </button>
            )
          })}
        </div>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="hidden md:inline-flex">
            <Button variant="outline" onClick={() => navigate(ROUTES.LOGIN)}>
              Login
            </Button>
          </span>

          <span className="hidden md:inline-flex">
            <Button variant="primary" onClick={() => navigate(ROUTES.SIGNUP)}>
              Get Started
            </Button>
          </span>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            className="md:hidden flex"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--white)',
            borderTop: '1px solid var(--grey)',
            padding: '1rem 2rem'
          }}
          className="md:hidden flex flex-col gap-4"
        >
          {navLinks.map((link) => {
            const active = activeSection === link.sectionId

            return (
              <button
                key={link.sectionId}
                onClick={() => scrollToSection(link.sectionId)}
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  color: active ? 'var(--primary-500)' : 'var(--black)',
                  fontWeight: 500,
                  padding: '0.5rem 0'
                }}
              >
                {link.label}
              </button>
            )
          })}

          <Button
            variant="outline"
            style={{ width: '100%' }}
            onClick={() => {
              navigate(ROUTES.LOGIN)
              setMobileMenuOpen(false)
            }}
          >
            Login
          </Button>

          <Button
            variant="primary"
            style={{ width: '100%' }}
            onClick={() => {
              navigate(ROUTES.SIGNUP)
              setMobileMenuOpen(false)
            }}
          >
            Get Started
          </Button>
        </div>
      )}
    </header>
  )
}

export default Header