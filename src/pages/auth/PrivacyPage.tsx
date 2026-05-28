import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function PrivacyPage() {
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
            <h1>Privacy Policy</h1>
            <p className="legal-updated">Effective upon use of the application</p>
            <hr className="legal-divider" />

            <div className="legal-section">
              <p>
                This Privacy Policy explains how the TGPL webapp collects, uses, and protects your information when you use the application.
              </p>
            </div>

            <div className="legal-section">
              <h2>Information We Collect</h2>
              <p>We may collect the following information:</p>
              <ul>
                <li>Personal information (such as name and email address)</li>
                <li>Login credentials</li>
                <li>Any information you provide during registration or use of the platform</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>How We Use Your Information</h2>
              <p>Your information is used to:</p>
              <ul>
                <li>Create and manage user accounts</li>
                <li>Provide access to the features</li>
                <li>Improve user experience and system performance</li>
                <li>Maintain security and prevent unauthorized access</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Data Security</h2>
              <p>
                We take reasonable technical and organizational measures to protect your personal data against unauthorized access, loss, or misuse.
              </p>
            </div>

            <div className="legal-section">
              <h2>Third-Party Sharing</h2>
              <p>
                We do not sell or share your personal information with third parties, except where required by law or for essential service functionality.
              </p>
            </div>

            <div className="legal-section">
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request corrections or updates</li>
                <li>Request deletion of your account and data</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Data Retention</h2>
              <p>
                We retain user data only as long as necessary to provide services or comply with obligations.
              </p>
            </div>

            <div className="legal-section">
              <h2>Updates to This Policy</h2>
              <p>
                This Privacy Policy may be updated periodically. Continued use of the application indicates acceptance of any updates.
              </p>
            </div>

            <div className="legal-section">
              <h2>Contact</h2>
              <p>
                For any questions regarding this Privacy Policy, please contact the development team or administrator.
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