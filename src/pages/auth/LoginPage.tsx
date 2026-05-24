import React, { useRef } from 'react'
import { Card, CardBody } from '../../components/Card'
import { Target, Telescope, BookOpen, Building2, Users, ArrowRight } from 'lucide-react'
import Button from '../../components/Button'

const LandingPage: React.FC = () => {
  // Section refs for smooth scrolling
  const aboutRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const impactRef = useRef<HTMLDivElement>(null)
  const founderRef = useRef<HTMLDivElement>(null)
  const getStartedRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Scroll to section function
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Store refs in window for header navigation
  React.useEffect(() => {
    ;(window as any).scrollToAbout = () => scrollToSection(aboutRef)
    ;(window as any).scrollToServices = () => scrollToSection(servicesRef)
    ;(window as any).scrollToContact = () => scrollToSection(contactRef)
  }, [])

  const stats = [
    { number: '500+', label: 'Professionals Trained' },
    { number: '100+', label: 'Projects Delivered' },
    { number: '95%', label: 'Success Rate' },
  ]

  const services = [
    {
      icon: Target,
      title: 'Project Management',
      description: 'End-to-end project management from initiation to closing.',
    },
    {
      icon: Building2,
      title: 'Organizational Consulting',
      description: 'Help organizations structure and strengthen their systems.',
    },
    {
      icon: BookOpen,
      title: 'Training Programs',
      description: 'Equip professionals with practical PM skills.',
    },
    {
      icon: Users,
      title: 'Community Network',
      description: 'Connect with Africa\'s growing PM network.',
    },
    {
      icon: Target,
      title: 'Strategic Planning',
      description: 'Develop strategies for project delivery excellence.',
    },
    {
      icon: ArrowRight,
      title: 'Implementation Support',
      description: 'Guide your team through execution and delivery.',
    },
  ]

  const impactStats = [
    { number: '15+', label: 'Years of Experience' },
    { number: '200+', label: 'Projects Delivered' },
    { number: '60%', label: 'Organizations Served' },
    { number: '7', label: 'African Countries' },
  ]

  const paths = [
    {
      title: 'Join a Training Cohort',
      description: 'Learn practical project management skills and earn your certification.',
      icon: BookOpen,
      buttonText: 'Explore Training',
    },
    {
      title: 'Hire TGPL for a Project',
      description: 'Need structure and strategy? We\'re ready to help your team execute.',
      icon: Building2,
      buttonText: 'Request Consultation',
      featured: true,
    },
    {
      title: 'Join Our Community',
      description: 'Stay updated and connect with Africa\'s growing PM network.',
      icon: Users,
      buttonText: 'Stay Connected',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
          animation: 'fadeIn 0.6s ease-out',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--black)',
              margin: '0 0 1rem 0',
              animation: 'slideDown 0.6s ease-out',
            }}
          >
            Building Africa's Next Generation of Project Leaders
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#4a4a4a',
              maxWidth: '700px',
              margin: '0 auto 2rem auto',
              lineHeight: 1.8,
              animation: 'slideDown 0.6s ease-out 0.1s both',
            }}
          >
            We train, consult, and manage projects that drive real impact. From skill development to project delivery, TGPL equips individuals and organizations to execute with excellence, strategy, and resilience.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              animation: 'slideDown 0.6s ease-out 0.2s both',
            }}
          >
            <Button variant="primary" size="medium">
              Get Started
            </Button>
            <Button variant="outline" size="medium">
              Learn More
            </Button>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '2rem auto 0 auto',
            padding: '0 2rem',
            height: '300px',
            backgroundColor: '#90caf9',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'slideUp 0.7s ease-out 0.3s both',
          }}
        >
          <img
            src="/image3.png"
            alt="TGPL Team"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px',
            }}
          />
        </div>

        {/* Stats */}
        <div
          style={{
            maxWidth: '1400px',
            margin: '3rem auto 0 auto',
            padding: '0 2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            textAlign: 'center',
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                animation: `slideUp 0.6s ease-out ${0.4 + index * 0.1}s both`,
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--primary-500)',
                }}
              >
                {stat.number}
              </div>
              <div style={{ fontSize: '0.95rem', color: '#4a4a4a' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        style={{
          backgroundColor: 'var(--white)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p
              style={{
                color: 'var(--primary-500)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              About Us
            </p>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--black)',
                margin: 0,
              }}
            >
              Who We Are
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3rem',
              alignItems: 'center',
            }}
            className="grid-cols-1 md:grid-cols-2"
          >
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: '#4a4a4a',
              }}
            >
              The Global Project Leaders (TGPL) is a project management agency, training organization, consultancy, and community founded in August 2024. TGPL was created to close the project management gap in Africa by empowering organizations, young professionals, and women with the skills and structure required to deliver successful and sustainable projects.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
              }}
            >
              <Card variant="default">
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Target size={24} color="var(--primary-500)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    Our Mission
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#4a4a4a', margin: 0 }}>
                    Close the project management gap in Africa.
                  </p>
                </CardBody>
              </Card>

              <Card variant="default">
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Telescope size={24} color="var(--primary-500)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    Our Vision
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#4a4a4a', margin: 0 }}>
                    Lead project management excellence in Africa.
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        ref={servicesRef}
        style={{
          backgroundColor: 'var(--white)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p
              style={{
                color: 'var(--primary-500)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Our Services
            </p>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--black)',
                margin: 0,
              }}
            >
              Comprehensive Project Management Solutions
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {services.map((service, index) => {
              const IconComponent = service.icon
              return (
                <Card key={index} variant="default">
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={24} color="var(--primary-500)" />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                      {service.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#4a4a4a', margin: 0 }}>
                      {service.description}
                    </p>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section
        ref={impactRef}
        style={{
          backgroundColor: '#2c3e50',
          color: 'var(--white)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'var(--primary-500)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            Our Impact
          </p>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              margin: '0 0 3rem 0',
            }}
          >
            Transforming Project Management Across Africa
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
            }}
          >
            {impactStats.map((stat, index) => (
              <div key={index}>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: 'var(--primary-500)',
                  }}
                >
                  {stat.number}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#b0c4de' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
            }}
          >
            <Button variant="primary" size="medium">
              Download our case
            </Button>
            <Button variant="outline" size="medium">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section
        ref={founderRef}
        style={{
          backgroundColor: 'var(--white)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'center',
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          <div style={{ position: 'relative', height: '300px' }}>
            <div
              style={{
                position: 'absolute',
                width: '250px',
                height: '250px',
                backgroundColor: '#2c3e50',
                borderRadius: '16px',
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                border: '10px solid var(--primary-500)',
                overflow: 'hidden',
                backgroundColor: '#e0e0e0',
                left: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/ceo.png"
                alt="Enobong Okposin"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
            </div>
          </div>

          <div>
            <p
              style={{
                color: 'var(--primary-500)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Leadership
            </p>
            <h2
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: 'var(--black)',
                margin: '0 0 0.5rem 0',
              }}
            >
              Enobong Okposin
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--primary-500)',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Founder & Chief Executive Officer
            </p>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.8,
                color: '#4a4a4a',
                marginBottom: '1.5rem',
              }}
            >
              Enobong is a senior project manager passionate about building systems, people, and results. Under her leadership, TGPL has grown into a platform empowering professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Get Started Paths Section */}
      <section
        ref={getStartedRef}
        style={{
          backgroundColor: '#f9f9f9',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p
              style={{
                color: 'var(--primary-500)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Get Started
            </p>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--black)',
                margin: 0,
              }}
            >
              Choose Your Path
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            {paths.map((path, index) => {
              const IconComponent = path.icon
              return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                  }}
                >
                  {path.featured && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: 'var(--primary-500)',
                          color: 'var(--white)',
                          padding: '0.375rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Most Popular
                      </span>
                    </div>
                  )}

                  <Card
                    variant="default"
                    style={{
                      backgroundColor: path.featured ? '#2c3e50' : 'var(--white)',
                      border: path.featured ? '2px solid var(--primary-500)' : '1px solid #f0f0f0',
                    }}
                  >
                    <CardBody
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        padding: '2rem',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: path.featured ? 'rgba(0, 102, 204, 0.2)' : '#e3f2fd',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent size={24} color="var(--primary-500)" />
                      </div>

                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: path.featured ? 'var(--white)' : 'var(--black)',
                          margin: 0,
                        }}
                      >
                        {path.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '0.95rem',
                          lineHeight: 1.7,
                          color: path.featured ? '#b0c4de' : '#4a4a4a',
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {path.description}
                      </p>

                      <Button variant="primary" size="medium" style={{ width: '100%' }}>
                        {path.buttonText}
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          backgroundColor: 'var(--primary-500)',
          color: 'var(--white)',
          paddingTop: '3rem',
          paddingBottom: '3rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
          }}
        >
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '0 0 1rem 0',
            }}
          >
            Ready to Transform Your Career?
          </h2>
          <p
            style={{
              fontSize: '1rem',
             
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
            }}
          >
            Join thousands of professionals building the future of project management in Africa.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button variant="secondary" size="medium">
              Get Started Now
            </Button>
            <Button variant="outline" size="medium">
              Request Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        ref={contactRef}
        style={{
          backgroundColor: 'var(--white)',
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          <div>
            <p
              style={{
                color: 'var(--primary-500)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Contact
            </p>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--black)',
                margin: '0 0 1.5rem 0',
              }}
            >
              Get in Touch
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#4a4a4a',
                marginBottom: '2rem',
              }}
            >
              Have questions? We'd love to hear from you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', margin: '0 0 0.25rem 0' }}>
                  EMAIL
                </p>
                <a href="mailto:theglobalprojectleaders@gmail.com" style={{ color: 'var(--black)', textDecoration: 'none' }}>
                  theglobalprojectleaders@gmail.com
                </a>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', margin: '0 0 0.25rem 0' }}>
                  PHONE
                </p>
                <a href="tel:+2348088044739" style={{ color: 'var(--black)', textDecoration: 'none' }}>
                  +234 808 804 4739
                </a>
              </div>
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--black)',
                marginBottom: '1.5rem',
              }}
            >
              Send us a message
            </p>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Your name"
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
              <textarea
                placeholder="Your message"
                rows={4}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
              <Button variant="primary" size="medium" style={{ width: '100%' }}>
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export default LandingPage