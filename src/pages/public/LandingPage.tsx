import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Card, CardBody } from '../../components/Card'
import { Target, Telescope, Award, Users, TrendingUp, Building2, BookOpen, CheckCircle, Mail, Phone, MapPin, Send } from 'lucide-react'
import Button from '../../components/Button'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
}
const fadeRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
}
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}
const vp = { once: true, amount: 0.2 }

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setFormData({ name: '', email: '', message: '' })
  }

  const aboutRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const impactRef = useRef<HTMLDivElement>(null)
  const founderRef = useRef<HTMLDivElement>(null)
  const getStartedRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const contactInfo = [
    { icon: Mail, label: 'EMAIL', value: 'theglobalprojectleaders@gmail.com', href: 'mailto:theglobalprojectleaders@gmail.com' },
    { icon: Phone, label: 'PHONE', value: '+234 808 804 4739', href: 'tel:+2348088044739' },
    { icon: MapPin, label: 'BASE', value: 'Nigeria — serving Africa & beyond', href: null },
  ]

  const badges = ['Senior Project Manager', 'Women in Leadership Advocate', 'Pan-African Capacity Builder', 'CAC-Registered Organization']

  const services = [
    { icon: Award, title: 'Project Management Training', description: 'Industry-recognized certification programs including PMP, PRINCE2, and Agile methodologies tailored for African professionals.' },
    { icon: Users, title: 'Strategic Consulting', description: 'Expert guidance on project planning, execution, and delivery for organizations across various sectors.' },
    { icon: TrendingUp, title: 'Career Development', description: 'Personalized mentorship and coaching programs designed to accelerate your professional growth.' },
    { icon: BookOpen, title: 'Corporate Training', description: 'Customized training solutions for organizations looking to upskill their project management teams.' },
    { icon: CheckCircle, title: 'Certification Support', description: 'Comprehensive exam preparation and ongoing support to ensure your certification success.' },
    { icon: Users, title: 'Community Network', description: 'Access to a thriving community of project managers, leaders, and professionals across Africa.' },
  ]

  const paths = [
    { title: 'Join a Training Cohort', description: 'Learn practical project management skills and earn your certification through our structured, expert-led programs.', icon: BookOpen, buttonText: 'Explore Training' },
    { title: 'Hire TGPL for a Project', description: "Need structure, strategy, or project delivery support? We're ready to help your team execute with clarity.", icon: Building2, buttonText: 'Request Consultation', featured: true },
    { title: 'Join Our Community', description: "Stay updated on programs, opportunities, and upcoming cohorts. Connect with Africa's growing PM network.", icon: Users, buttonText: 'Stay Connected' },
  ]

  const stats = [
    { number: '15+', label: 'Projects delivered', sub: 'across 7 industries' },
    { number: '200+', label: 'People trained', sub: 'in project management' },
    { number: '60%', label: 'Female participation', sub: 'in training programs' },
    { number: '7', label: 'Industries served', sub: 'with cross-industry experience' },
  ]

  return (
    <>
      <style>{`
  @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

  .lp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
  .lp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
  .lp-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
  .lp-paths { display: grid; grid-template-columns: repeat(3, 354px); gap: 2rem; justify-content: center; align-items: center; }
  .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,102,204,0.12); }

  @media (max-width: 900px) {
    .lp-grid-2 { grid-template-columns: 1fr !important; gap: 2rem !important; }
    .lp-grid-3 { grid-template-columns: 1fr !important; }
    .lp-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
    .lp-paths { grid-template-columns: 1fr !important; width: 100%; }
    .lp-paths > div > div { width: 100% !important; height: auto !important; }
    .cta-section { padding: 60px 2rem !important; }
    .contact-section { padding: 60px 2rem !important; }
    .founder-img-wrap { width: 100% !important; height: 380px !important; }
  }
  @media (max-width: 600px) {
    .lp-grid-4 { grid-template-columns: 1fr !important; }
    .hero-badges { display: none; }
  }
`}</style>

      {/* Hero */}
      {/* Hero */}
<section id="home" style={{ position: 'relative', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', backgroundColor: '#2890E4', paddingTop: '5rem' }}>
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,#D9D9D9, #90C3EB, #D9D9D9)', zIndex: 0 }} />

  {/* Image — plain div wrapper, no y animation */}
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
    style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '55%', maxWidth: '680px', zIndex: 1 }}
  >
    <img src="/Image4.png" alt="TGPL Hero" style={{ width: '100%', objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
  </motion.div>

  {/* Diamonds — no x/y, only opacity + scale */}
  {[
    { left: '28%', top: '52%', size: 22 }, { left: '32%', bottom: '22%', size: 16 },
    { right: '28%', top: '48%', size: 20 }, { right: '25%', bottom: '30%', size: 13 },
  ].map((d, i) => (
    <motion.div
      key={i} className="hero-badges"
      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.75, scale: 1 }}
      transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
      style={{ position: 'absolute', left: d.left, right: (d as any).right, top: d.top, bottom: (d as any).bottom, width: d.size, height: d.size, backgroundColor: '#D9D9D9', borderRadius: '3px', transform: 'rotate(45deg)', zIndex: 3 }}
    />
  ))}

  {/* Badges */}
  <motion.div
    className="hero-badges"
    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
    style={{ position: 'absolute', left: '30%', bottom: '15%', backgroundColor: '#2f80ed', color: 'white', padding: '0.75rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 4, maxWidth: '318px' }}
  >
    <div style={{ width: 36, height: 36, backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2890E4" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>
    </div>
    <div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Hands on Learning</div><div style={{ fontSize: '0.73rem', opacity: 0.85 }}>Easy lessons, active live sessions</div></div>
  </motion.div>

  <motion.div
    className="hero-badges"
    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
    style={{ position: 'absolute', right: '20%', bottom: '10%', backgroundColor: 'rgba(20,30,45,0.93)', color: 'white', padding: '0.75rem 1.1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 4, maxWidth: '318px' }}
  >
    <div style={{ width: 36, height: 36, backgroundColor: '#2f80ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>
    </div>
    <div><div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Certified Excellence</div><div style={{ fontSize: '0.73rem', opacity: 0.7 }}>Industry-recognized training</div></div>
  </motion.div>

  {/* Text */}
  <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 2rem', maxWidth: '780px', margin: '0 auto' }}>
    <motion.h1
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      style={{ fontSize: 'clamp(1.8rem, 5vw, 3.4rem)', fontWeight: 700, color: '#2C3C45', margin: '0 0 1.25rem 0', lineHeight: 1.2 }}
    >
      Building Africa's Next Generation of Project Leaders
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
      style={{ fontSize: '1.05rem', color: '#2C3C45', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.8 }}
    >
      We train, consult, and manage projects that drive real impact. From skill development to project delivery, TGPL equips individuals and organizations to execute with structure, strategy, and confidence.
    </motion.p>
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
      style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
    >
      <Button variant="primary" size="medium">Get Started</Button>
      <Button variant="outline" size="medium" style={{ borderColor: '#ffffff', color: '#2C3C45' }}>Learn More</Button>
    </motion.div>
  </div>
  <div style={{ height: '440px', width: '100%', zIndex: 0 }} />
</section>

      {/* Stats bar */}
      <section style={{ backgroundColor: 'white', borderBottom: '1px solid #e8ecf0', padding: '1.75rem 2rem' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={vp}
          style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}
        >
          {[{ number: '5000+', label: 'Trained' }, { number: '150+', label: 'Clients' }, { number: '95%', label: 'Success Rate' }].map((s, i) => (
            <motion.div key={i} variants={fadeUp} style={{ borderRight: i < 2 ? '1px solid #e8ecf0' : 'none', padding: '0 1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2890E4' }}>{s.number}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7a8d' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* About */}
      <section id="about" ref={aboutRef} style={{ backgroundColor: '#f4f6f8', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>About TGPL</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2e3d', margin: 0 }}>Who We Are</h2>
          </motion.div>

          <div className="lp-grid-2" style={{ marginBottom: '4rem', alignItems: 'center' }}>
            <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={vp}>
              <p style={{ fontSize: '1rem', lineHeight: 1.9, color: '#4a4a4a', marginBottom: '1.5rem' }}>The Global Project Leaders (TGPL) is a project management agency, training organization, consultancy, and community founded in August 2024 and registered with the Corporate Affairs Commission (CAC), Nigeria.</p>
              <p style={{ fontSize: '1rem', lineHeight: 1.9, color: '#4a4a4a', margin: 0 }}>TGPL was created to close the project management gap in Africa by empowering organizations, young professionals, and women with the skills and structure required to deliver successful and sustainable projects.</p>
            </motion.div>
            <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={vp} style={{ position: 'relative', width: '100%', height: '400px' }}>
              <div style={{ position: 'absolute', top: 58, left: 0, width: 199, height: 199, backgroundColor: '#2890E4', borderRadius: 26, zIndex: 3, transform: 'rotate(-26.94deg)' }} />
              <div style={{ position: 'absolute', top: 80, left: 350, width: 166, height: 166, backgroundColor: '#1e2d3d', borderRadius: 22, zIndex: 1, transform: 'rotate(-26.94deg)' }} />
              <img src="/image6.png" alt="TGPL Team" style={{ position: 'absolute', left: 131, top: 20, width: 327, height: 384, objectFit: 'cover', borderRadius: 16, zIndex: 2 }} />
            </motion.div>
          </div>

          <motion.div className="lp-grid-2" variants={stagger} initial="hidden" whileInView="show" viewport={vp}>
            {[
              { icon: <Target size={26} color="#2890E4" />, title: 'Our Mission', text: 'To close the effective project management gap in Africa by equipping a new generation of organizations, young people and women with the skills, structure, and resilience to deliver impactful projects across industries.' },
              { icon: <Telescope size={26} color="#2890E4" />, title: 'Our Vision', text: 'Within the next 10 years, to position TGPL as the leading core of project management excellence in Africa — where young people and women are at the forefront of delivering projects that meet global standards.' },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,102,204,0.12)' }} transition={{ duration: 0.25 }}
                style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #e8ecf0', padding: '2rem' }}>
                <div style={{ width: 48, height: 48, backgroundColor: '#EBF5FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>{card.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem 0' }}>{card.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#4a4a4a', margin: 0 }}>{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" ref={servicesRef} style={{ backgroundColor: '#EBF5FF', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Our Services</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2e3d', margin: 0 }}>Comprehensive Project Management Solutions</h2>
            <p style={{ fontSize: '1.1rem', color: '#4a4a4a', maxWidth: '700px', margin: '0 auto 2.5rem auto', lineHeight: 1.7 }}>
              From strategic consulting to professional certification, we provide everything you need to excel in project management.
            </p>
          </motion.div>
          <motion.div className="lp-grid-3" variants={stagger} initial="hidden" whileInView="show" viewport={vp}>
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,102,204,0.12)' }} transition={{ duration: 0.25 }}>
                <Card variant="default">
                  <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
                    <s.icon size={28} color="#2890E4" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{s.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#4a4a4a', margin: 0, lineHeight: 1.65 }}>{s.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" ref={impactRef} style={{ backgroundColor: '#1e2d3d', color: 'white', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Measurable Results</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', margin: '0 0 1.25rem 0' }}>Our Impact</h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', maxWidth: '680px', margin: '0 auto 3.5rem auto', lineHeight: 1.7 }}>
              From strategic consulting to professional certification, we provide everything you need to excel in project management.
            </p>
          </motion.div>
          <motion.div className="lp-grid-4" variants={stagger} initial="hidden" whileInView="show" viewport={vp}
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', marginBottom: '3rem' }}>
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} style={{ padding: '2.5rem 1.5rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none', textAlign: 'left' }}>
                <div style={{ width: 28, height: 3, backgroundColor: '#2890E4', marginBottom: '1.25rem' }} />
                <div style={{ fontSize: '3.5rem', fontWeight: 700, color: '#2890E4', lineHeight: 1, marginBottom: '1rem' }}>{s.number}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{s.sub}</div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(40,144,228,0.4)', borderRadius: 12, padding: '1rem 2rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2890E4" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)' }}>Registered with the <span style={{ color: '#2890E4', fontWeight: 600 }}>Corporate Affairs Commission (CAC)</span>, Nigeria</span>
          </motion.div>
        </div>
      </section>

      {/* Founder */}
      <section id="founder" ref={founderRef} style={{ backgroundColor: '#E9F5FF', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Leadership</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2e3d', margin: 0 }}>Meet the Founder</h2>
          </motion.div>
          <div className="lp-grid-2" style={{ alignItems: 'center' }}>
            <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={vp}>
              <div className="founder-img-wrap" style={{ position: 'relative', height: 451, width: 347, maxWidth: '100%' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 340, height: 340, backgroundColor: '#2B3942', borderRadius: 20, zIndex: 1 }} />
                <img src="/ceo.png" alt="Enobong Okposin" style={{ position: 'absolute', bottom: 0, left: 16, width: 331, height: 451, objectFit: 'cover', objectPosition: 'top', borderRadius: 16, transform: 'scaleX(-1)', zIndex: 2 }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 200 }} viewport={vp}
                  style={{ position: 'absolute', bottom: 24, right: 0, backgroundColor: '#2890E4', color: 'white', padding: '0.75rem 1.25rem', borderRadius: 10, zIndex: 3 }}
                >
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>10+</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.2rem', opacity: 0.9 }}>Years Experience</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={vp}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2e3d', margin: '0 0 0.4rem 0' }}>Enobong Okposin</h2>
              <p style={{ fontSize: '1rem', color: '#2890E4', fontWeight: 600, margin: '0 0 1rem 0' }}>Founder & Chief Executive Officer</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
                {[
                  { href: 'https://linkedin.com/in/enobong-okposin', d: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z', extra: <circle cx="4" cy="4" r="2" fill="white" /> },
                  { href: '#', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z' },
                ].map((icon, i) => (
                  <a key={i} href={icon.href} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, backgroundColor: '#1a2e3d', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d={icon.d} />{icon.extra}</svg>
                  </a>
                ))}
              </div>
              <p style={{ fontSize: '0.97rem', lineHeight: 1.85, color: '#3a4a5a', marginBottom: '1.75rem' }}>Enobong Okposin is a senior project manager passionate about building systems, people, and results. Under her leadership, TGPL has grown into a platform empowering emerging professionals to bridge the gap between knowledge and execution.</p>
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={vp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {badges.map((b, i) => (
                  <motion.div key={i} variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2890E4" strokeWidth="2"><path d="M12 2L2 12l10 10 10-10L12 2z" /></svg>
                    <span style={{ fontSize: '0.93rem', color: '#1a2e3d' }}>{b}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section ref={getStartedRef} style={{ backgroundColor: '#f7f7f7', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Get Started</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2e3d', margin: 0 }}>Choose Your Path</h2>
          </motion.div>
          <motion.div className="lp-paths" variants={stagger} initial="hidden" whileInView="show" viewport={vp}>
            {paths.map((path, i) => {
              const Icon = path.icon; const f = path.featured
              return (
                <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }} transition={{ duration: 0.25 }} style={{ position: 'relative' }}>
                  {f && <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}><span style={{ backgroundColor: '#2890E4', color: 'white', padding: '0.35rem 1.25rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</span></div>}
                  <div style={{ backgroundColor: f ? '#1e2d3d' : 'white', border: f ? '2px solid #2890E4' : '1px solid #e8ecf0', borderRadius: 20, width: '100%', height: f ? 420 : 390, padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box', boxShadow: f ? '0 20px 40px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 56, height: 56, backgroundColor: f ? 'rgba(40,144,228,0.2)' : '#EBF5FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={26} color="#2890E4" /></div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: f ? 'white' : '#1a2e3d', margin: 0 }}>{path.title}</h3>
                    <p style={{ fontSize: '0.93rem', lineHeight: 1.7, color: f ? 'rgba(255,255,255,0.7)' : '#4a5a6a', margin: 0, flex: 1, textAlign: f ? 'center' : 'left' }}>{path.description}</p>
                    <Button variant="primary" size="medium" style={{ width: '100%', borderRadius: 10 }}>{path.buttonText}</Button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ backgroundColor: '#2890E4', color: 'white', padding: '80px 164px', textAlign: 'center' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={vp}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Ready to Transform Your Career?</h2>
          <p style={{ fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto', opacity: 0.9, lineHeight: 1.7 }}>Join thousands of professionals building the future of project management in Africa.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="medium">View All Programs</Button>
            <Button variant="ghost" size="medium">Schedule Consultation</Button>
          </div>
        </motion.div>
      </section>

      {/* Contact */}
      <section id="contact" ref={contactRef} className="contact-section" style={{ backgroundColor: 'white', padding: '80px 120px' }}>
        <div className="lp-grid-2" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div variants={fadeLeft} initial="hidden" whileInView="show" viewport={vp}>
            <p style={{ color: '#2890E4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contact</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2e3d', margin: '0 0 1rem 0' }}>Get in Touch</h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#4a4a4a', marginBottom: '1.5rem' }}>Have questions about our services, training programs, or partnerships? We'd love to hear from you.</p>
            <div style={{ width: 60, height: 4, backgroundColor: '#2890E4', marginBottom: '2.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              {contactInfo.map((info, i) => {
                const Icon = info.icon
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, backgroundColor: '#EBF5FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={22} color="#2890E4" /></div>
                    <div>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.2rem 0' }}>{info.label}</p>
                      {info.href
                        ? <a href={info.href} style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1a2e3d', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#2890E4'} onMouseLeave={e => e.currentTarget.style.color = '#1a2e3d'}>{info.value}</a>
                        : <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1a2e3d', margin: 0 }}>{info.value}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: 12 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a2e3d', margin: '0 0 0.5rem 0' }}>Response time</h4>
              <p style={{ fontSize: '0.85rem', color: '#4a4a4a', margin: 0, lineHeight: 1.6 }}>We typically respond within 1-2 business days. For urgent inquiries, please call us directly.</p>
            </div>
          </motion.div>

          <motion.div variants={fadeRight} initial="hidden" whileInView="show" viewport={vp}
            style={{ backgroundColor: '#f9f9f9', padding: '2.5rem', borderRadius: 12, alignSelf: 'start' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a2e3d', margin: '0 0 0.5rem 0' }}>Send us a message</h2>
            <p style={{ fontSize: '0.95rem', color: '#4a4a4a', margin: '0 0 2rem 0' }}>Fill in the form and we'll be in touch shortly.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[{ label: 'Name', name: 'name', type: 'text', placeholder: 'Your full name' }, { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com' }].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#1a2e3d' }}>{label}</label>
                  <input type={type} name={name} placeholder={placeholder} value={formData[name as keyof typeof formData]} onChange={handleChange} required
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', backgroundColor: 'white', color: '#1a2e3d' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2890E4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,144,228,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#1a2e3d' }}>Message</label>
                <textarea name="message" placeholder="Tell us how we can help you..." value={formData.message} onChange={handleChange} required rows={5}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: '0.95rem', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'white', color: '#1a2e3d', resize: 'vertical' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2890E4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,144,228,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <Button variant="primary" size="medium" icon={<Send size={18} />} style={{ width: '100%', marginTop: '0.5rem' }}>Send Message</Button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default LandingPage