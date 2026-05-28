import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function TermsPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .legal-page {
          min-height: 100vh;
          background: var(--grey);
          padding: 2.5rem 1.5rem;
          font-family: inherit;
        }
        .legal-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .legal-logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .legal-logo img {
          height: 2.75rem;
        }
        .legal-card {
          background: var(--white);
          border: 1px solid #E8E8E8;
          border-radius: var(--radius-lg);
          padding: 2.5rem 2.75rem;
          box-shadow: var(--shadow-sm);
        }
        .legal-card h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--black);
          margin: 0 0 0.375rem 0;
        }
        .legal-card .legal-updated {
          font-size: 0.8125rem;
          color: #999;
          margin: 0 0 2rem 0;
        }
        .legal-divider {
          border: none;
          border-top: 1px solid #EFEFEF;
          margin: 0 0 2rem 0;
        }
        .legal-section {
          margin-bottom: 1.75rem;
        }
        .legal-section h2 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--black);
          margin: 0 0 0.625rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .legal-section h2::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 1rem;
          background: var(--primary-500);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .legal-section p {
          font-size: 0.9125rem;
          color: #444;
          line-height: 1.75;
          margin: 0 0 0.5rem 0;
        }
        .legal-section ul {
          margin: 0.25rem 0 0 0;
          padding-left: 1.25rem;
          list-style: disc;
        }
        .legal-section ul li {
          font-size: 0.9125rem;
          color: #444;
          line-height: 1.75;
          margin-bottom: 0.25rem;
        }
        .legal-back {
          text-align: center;
          margin-top: 2rem;
        }
        .legal-back a {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-500);
          text-decoration: none;
        }
        .legal-back a:hover {
          text-decoration: underline;
        }
        @media (max-width: 640px) {
          .legal-card { padding: 1.75rem 1.25rem; }
          .legal-card h1 { font-size: 1.375rem; }
        }
      `}</style>

      <div className="legal-page">
        <div className="legal-container">
          <div className="legal-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          <div className="legal-card">
            <h1>Terms of Service</h1>
            <p className="legal-updated">Effective upon use of the application</p>
            <hr className="legal-divider" />

            <div className="legal-section">
              <p>
                Welcome to TGPL web app. By accessing or using this application, you agree to be bound by these Terms of Service.
                If you do not agree with any part of these terms, you should not use the application.
              </p>
            </div>

            <div className="legal-section">
              <h2>Eligibility</h2>
              <p>
                You must be at least 18 years old or have legal permission from a guardian to use this application.
              </p>
            </div>

            <div className="legal-section">
              <h2>Account Responsibilities</h2>
              <p>To access certain features, you may be required to create an account. You are responsible for:</p>
              <ul>
                <li>Providing accurate and complete information</li>
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activities that occur under your account</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the application for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the system</li>
                <li>Interfere with the proper functioning of the application</li>
                <li>Upload malicious code or engage in abusive behavior</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Service Changes</h2>
              <p>
                We may update, suspend, or discontinue parts of the website at any time without prior notice.
              </p>
            </div>

            <div className="legal-section">
              <h2>Intellectual Property</h2>
              <p>
                All content, design, and features of this application remain the property of the development team unless otherwise stated.
              </p>
            </div>

            <div className="legal-section">
              <h2>Termination</h2>
              <p>
                We reserve the right to suspend or terminate access to the application if users violate these terms.
              </p>
            </div>

            <div className="legal-section">
              <h2>Updates to These Terms</h2>
              <p>
                These Terms may be updated from time to time as the website evolves. Continued use of the app means you accept the updated terms.
              </p>
            </div>

            <div className="legal-section">
              <h2>Contact</h2>
              <p>
                For questions regarding these Terms, please contact the development team or project administrator.
              </p>
            </div>
          </div>

          <div className="legal-back">
           <Link to={ROUTES.SIGNUP}>← Back to Sign Up</Link>
          </div>
        </div>
      </div>
    </>
  )
}