import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Authentication Gateway (pages/auth/AuthPage.jsx)
 * ============================================================================
 * 
 * Design Principles:
 * - Master UI/UX Palette: Deep obsidian foundation (#08080F).
 * - Dynamic Hero Imaging: Seamlessly crossfades between /images/patient-auth.jpg
 *   and /images/doctor-auth.jpg depending on active role selection.
 * - Minimalist & Human-Centric: Clean, distraction-free Google SSO without
 *   technical jargon or noisy feature checklists.
 */
export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, isAuthenticated, role, isLoading } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialRole = searchParams.get('role') === 'doctor' ? 'doctor' : 'patient';
  const oauthError = searchParams.get('error');

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const destination = role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const isDoctor = selectedRole === 'doctor';

  const handleRoleChange = (targetRole) => {
    setSelectedRole(targetRole);
  };

  const handleGoogleSignIn = () => {
    loginWithGoogle(selectedRole);
  };

  return (
    <div className={`helio-auth-root ${isDoctor ? 'theme-doctor' : 'theme-patient'}`}>
      {/* Embedded Self-Contained Styles */}
      <style>{`
        .helio-auth-root {
          min-height: 100vh;
          width: 100%;
          background-color: #08080F;
          color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Subtle ambient radial background */
        .helio-auth-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.65) 0%, #08080F 85%);
          pointer-events: none;
        }

        /* Top Nav Back Link */
        .auth-top-nav {
          position: absolute;
          top: 24px;
          left: 28px;
          z-index: 30;
        }

        .auth-back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          font-size: 0.82rem;
          font-weight: 500;
          text-decoration: none;
          backdrop-filter: blur(10px);
          transition: all 0.22s ease;
        }

        .auth-back-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.16);
          color: #FFFFFF;
          transform: translateX(-3px);
        }

        /* Master Centered Composition Frame */
        .auth-master-frame {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 56px;
          max-width: 900px;
          width: 100%;
          opacity: 0;
          transform: translateY(16px) scale(0.99);
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-master-frame.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ============================================================
           LEFT SIDE: Visual Healthcare Card with Dynamic Ambient Glow
           ============================================================ */
        .auth-visual-column {
          position: relative;
          flex-shrink: 0;
        }

        .auth-visual-underglow {
          position: absolute;
          inset: 20px 10px -20px 10px;
          border-radius: 32px;
          filter: blur(40px);
          opacity: 0.4;
          z-index: 1;
          transition: background 0.6s ease;
          pointer-events: none;
        }

        .theme-patient .auth-visual-underglow {
          background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.08) 60%, transparent 80%);
        }

        .theme-doctor .auth-visual-underglow {
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.25) 0%, rgba(56, 189, 248, 0.08) 60%, transparent 80%);
        }

        .auth-visual-card {
          position: relative;
          z-index: 2;
          width: 360px;
          height: 480px;
          border-radius: 28px;
          overflow: hidden;
          background: #0B0F19;
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 
            0 24px 60px -10px rgba(0, 0, 0, 0.85),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
        }

        .auth-visual-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-visual-card:hover .auth-visual-card__img {
          transform: scale(1.035);
        }

        .auth-visual-card__scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.1) 0%,
            transparent 45%,
            rgba(8, 8, 15, 0.82) 75%,
            rgba(8, 8, 15, 0.98) 100%
          );
          pointer-events: none;
        }

        .auth-visual-card__footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          z-index: 3;
        }

        .auth-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .auth-brand-logo-img {
          width: 26px;
          height: 26px;
          object-fit: contain;
        }

        .auth-brand-text {
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }

        .auth-brand-badge-pill {
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #E2E8F0;
        }

        .auth-brand-tagline {
          font-size: 0.8rem;
          color: #94A3B8;
          margin: 0;
          line-height: 1.4;
          font-weight: 400;
        }

        /* ============================================================
           RIGHT SIDE: Minimalist Modern Auth Form
           ============================================================ */
        .auth-form-column {
          width: 360px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-form-title {
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          font-size: 2.15rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.03em;
          margin: 0 0 8px 0;
        }

        .auth-form-subtitle {
          font-size: 0.9rem;
          color: #94A3B8;
          margin: 0 0 28px 0;
          line-height: 1.45;
        }

        /* Error Banner */
        .auth-error-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #FCA5A5;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-bottom: 22px;
        }

        /* Segmented Role Switcher */
        .auth-segmented-control {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          padding: 4px;
          margin-bottom: 30px;
        }

        .auth-segment-indicator {
          position: absolute;
          top: 4px;
          bottom: 4px;
          width: calc(50% - 4px);
          border-radius: 9999px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease;
          z-index: 1;
        }

        .auth-segment-indicator.is-patient {
          left: 4px;
          transform: translateX(0);
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 4px 14px -2px rgba(16, 185, 129, 0.35);
        }

        .auth-segment-indicator.is-doctor {
          left: 4px;
          transform: translateX(calc(100% + 0px));
          background: linear-gradient(135deg, #38BDF8 0%, #2563EB 100%);
          box-shadow: 0 4px 14px -2px rgba(56, 189, 248, 0.35);
        }

        .auth-segment-btn {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border: none;
          background: transparent;
          color: #94A3B8;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 9999px;
          transition: color 0.22s ease;
        }

        .auth-segment-btn.active {
          color: #FFFFFF;
        }

        /* Google OAuth Primary CTA */
        .auth-btn-google-sso {
          width: 100%;
          padding: 15px 22px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: none;
          color: #0F172A;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 16px;
          box-shadow: 0 4px 20px -2px rgba(255, 255, 255, 0.16);
        }

        .auth-btn-google-sso:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px -2px rgba(255, 255, 255, 0.25);
          background: #F8FAFC;
        }

        .auth-btn-google-sso:active {
          transform: translateY(0);
        }

        .auth-btn-google-sso:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-google-logo {
          flex-shrink: 0;
        }

        /* Clean Micro-Notice */
        .auth-micro-notice {
          text-align: center;
          font-size: 0.78rem;
          color: #64748B;
          margin: 0 0 32px 0;
          line-height: 1.45;
        }

        /* Footer Prompt */
        .auth-form-footer {
          text-align: center;
          font-size: 0.82rem;
          color: #64748B;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 20px;
        }

        .auth-footer-link {
          color: #94A3B8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .auth-footer-link:hover {
          color: #FFFFFF;
        }

        .auth-security-caption {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          color: #475569;
        }

        /* Responsive Breakpoints */
        @media (max-width: 820px) {
          .helio-auth-root {
            padding-top: 84px;
            padding-bottom: 40px;
            align-items: flex-start;
          }

          .auth-top-nav {
            top: 18px;
            left: 20px;
          }

          .auth-master-frame {
            flex-direction: column;
            gap: 28px;
          }

          .auth-visual-card {
            width: 320px;
            height: 240px;
          }

          .auth-form-column {
            width: 100%;
            max-width: 340px;
          }

          .auth-form-title {
            font-size: 1.75rem;
          }
        }
      `}</style>

      {/* Top Left Navigation Link */}
      <nav className="auth-top-nav">
        <Link to="/" className="auth-back-button">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </nav>

      {/* Master 2-Column Composition */}
      <main className={`auth-master-frame ${mounted ? 'is-visible' : ''}`}>
        
        {/* ================================================================
            LEFT: Visual Healthcare Card with Dynamic Hero Crossfade
            ================================================================ */}
        <section className="auth-visual-column">
          <div className="auth-visual-underglow" />
          
          <div className="auth-visual-card">
            <img
              src={isDoctor ? '/images/doctor-auth.jpg' : '/images/patient-auth.jpg'}
              alt={isDoctor ? 'HELIO Doctor Clinical Portal' : 'HELIO Patient Health Portal'}
              className="auth-visual-card__img"
            />
            <div className="auth-visual-card__scrim" />

            <div className="auth-visual-card__footer">
              <div className="auth-brand-row">
                <img
                  src="/helio-logo-symbol-colored.png"
                  alt="HELIO"
                  className="auth-brand-logo-img"
                />
                <span className="auth-brand-text">HELIO</span>
                <span className="auth-brand-badge-pill">{isDoctor ? 'DOCTOR' : 'PATIENT'}</span>
              </div>
              <p className="auth-brand-tagline">
                {isDoctor
                  ? 'Clinical decision support & patient cohort oversight.'
                  : 'Personalized medication tracking & care collaboration.'}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            RIGHT: Clean Minimalist Sign-In Form
            ================================================================ */}
        <section className="auth-form-column">
          <h1 className="auth-form-title">Sign in to HELIO</h1>
          <p className="auth-form-subtitle">
            Choose your account to access your portal
          </p>

          {/* Feedback error banner */}
          {oauthError && (
            <div className="auth-error-chip">
              <AlertCircle size={15} />
              <span>Authentication was interrupted. Please retry.</span>
            </div>
          )}

          {/* Segmented Role Switcher */}
          <div className="auth-segmented-control">
            <div
              className={`auth-segment-indicator ${isDoctor ? 'is-doctor' : 'is-patient'}`}
            />
            <button
              type="button"
              onClick={() => handleRoleChange('patient')}
              className={`auth-segment-btn ${!isDoctor ? 'active' : ''}`}
            >
              <User size={15} />
              <span>Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              className={`auth-segment-btn ${isDoctor ? 'active' : ''}`}
            >
              <Stethoscope size={15} />
              <span>Doctor</span>
            </button>
          </div>

          {/* Primary Action Button: Single-Click Google OAuth SSO */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="auth-btn-google-sso"
            aria-label={`Continue with Google as ${isDoctor ? 'Doctor' : 'Patient'}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" className="auth-google-logo">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google as {isDoctor ? 'Doctor' : 'Patient'}</span>
                <ArrowRight size={16} style={{ marginLeft: 'auto' }} />
              </>
            )}
          </button>

          {/* Simple Reassuring Security Note */}
          <p className="auth-micro-notice">
            Fast, secure single sign-on with your Google account.
          </p>

          {/* Footer & Standard Healthcare Compliance Seal */}
          <div className="auth-form-footer">
            <div>
              <span>Need assistance? </span>
              <a href="mailto:support@helio.health" className="auth-footer-link">
                Contact Support
              </a>
            </div>
            <div className="auth-security-caption">
              <ShieldCheck size={13} color="#10B981" />
              <span>HIPAA Compliant · 256-Bit SSL Encryption</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default AuthPage;
