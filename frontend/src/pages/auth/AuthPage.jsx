import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Stethoscope,
  User,
  ArrowRight,
  Zap,
  Activity,
  HeartPulse,
  ChevronLeft,
  Lock,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import './AuthPage.css';

/**
 * ============================================================================
 * HELIO Healthcare Platform - Authentication Page (AuthPage.jsx)
 * Human-Friendly, Simple, Dynamic & Beautifully Designed
 * ============================================================================
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
    const timer = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // If already authenticated, redirect to portal
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
    <div className="auth-root">
      {/* Background Mesh & Ambient Lighting */}
      <div className="auth-ambient-mesh" />
      <div className={`auth-orb auth-orb--primary ${isDoctor ? 'is-doctor' : 'is-patient'}`} />
      <div className="auth-orb auth-orb--secondary" />

      <div className={`auth-container ${mounted ? 'auth-container--visible' : ''}`}>
        
        {/* =====================================================================
            LEFT PANEL: Visual Showcase & Human-Centric Health Story
            ===================================================================== */}
        <div className="auth-showcase">
          <div>
            <div className="auth-showcase__header">
              <Link to="/" className="auth-back-btn">
                <ChevronLeft size={14} />
                <span>Back to Home</span>
              </Link>

              <div className={`auth-badge-enclave ${isDoctor ? 'is-doctor' : ''}`}>
                <span className={`auth-status-pulse ${isDoctor ? 'is-doctor' : ''}`} />
                <span>{isDoctor ? 'Doctor Sign In' : 'Patient Sign In'}</span>
              </div>
            </div>

            {/* Dynamic AI Healthcare Image Showcase */}
            <div className={`auth-image-frame ${isDoctor ? 'is-doctor' : ''}`}>
              <img
                src={isDoctor ? '/images/doctor-portal-artwork.jpg' : '/images/patient-portal-artwork.jpg'}
                alt={isDoctor ? 'Doctor clinical care dashboard' : 'Patient medication reminder schedule'}
                className="auth-image-frame__img"
              />
              <div className="auth-image-frame__overlay" />
            </div>

            <h1 className="auth-hero-title">
              {isDoctor ? (
                <>
                  Better Insights.
                  <br />
                  <span className="auth-gradient-word is-doctor">Healthier Patients.</span>
                </>
              ) : (
                <>
                  Your Medicines.
                  <br />
                  <span className="auth-gradient-word">Simple & On Time.</span>
                </>
              )}
            </h1>

            <p className="auth-hero-sub">
              {isDoctor
                ? 'Follow your patients’ daily medication routines, review treatment plans, and prevent harmful drug interactions in real time.'
                : 'Never miss a dose. Track your daily medicines with gentle reminders, and stay easily connected with your doctor.'}
            </p>

            {/* 3 Human-Friendly Trust Highlights */}
            <div className={`auth-telemetry-box ${isDoctor ? 'is-doctor' : ''}`}>
              <div className="auth-telemetry-grid">
                <div className="auth-telemetry-stat">
                  <span className="auth-telemetry-stat__label">Privacy</span>
                  <span className={`auth-telemetry-stat__value ${isDoctor ? 'is-doctor' : 'is-patient'}`}>
                    <ShieldCheck size={14} />
                    100% Private
                  </span>
                </div>
                <div className="auth-telemetry-stat">
                  <span className="auth-telemetry-stat__label">Sign In</span>
                  <span className={`auth-telemetry-stat__value ${isDoctor ? 'is-doctor' : 'is-patient'}`}>
                    <Zap size={14} />
                    One Click
                  </span>
                </div>
                <div className="auth-telemetry-stat">
                  <span className="auth-telemetry-stat__label">Care Team</span>
                  <span className={`auth-telemetry-stat__value ${isDoctor ? 'is-doctor' : 'is-patient'}`}>
                    <HeartPulse size={14} />
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-showcase__footer">
            <Lock size={15} color={isDoctor ? '#38BDF8' : '#10B981'} />
            <span>Private & Encrypted · Strict Healthcare Privacy Standards</span>
          </div>
        </div>

        {/* =====================================================================
            RIGHT PANEL: Clear Role Choice & Easy Google Sign In
            ===================================================================== */}
        <div className="auth-action-panel">
          <div className="auth-action-panel__header">
            <h2 className="auth-title">Welcome to HELIO</h2>
            <p className="auth-subtitle">
              Choose your account type to sign in
            </p>
          </div>

          {/* Feedback message if sign in was interrupted */}
          {oauthError && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>Sign in was cancelled. Please try again.</span>
            </div>
          )}

          {/* Role Choice Tabs */}
          <div className="auth-role-tabs">
            <button
              type="button"
              onClick={() => handleRoleChange('patient')}
              className={`auth-role-tab ${!isDoctor ? 'active-patient' : ''}`}
            >
              <User size={16} />
              <span>I am a Patient</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              className={`auth-role-tab ${isDoctor ? 'active-doctor' : ''}`}
            >
              <Stethoscope size={16} />
              <span>I am a Doctor</span>
            </button>
          </div>

          {/* Human-Friendly Account Overview */}
          <div className="auth-role-desc-card">
            <div className={`auth-role-desc-card__icon ${isDoctor ? 'is-doctor' : 'is-patient'}`}>
              {isDoctor ? <Activity size={18} /> : <HeartPulse size={18} />}
            </div>
            <div>
              <div className="auth-role-desc-card__title">
                {isDoctor ? 'Doctor & Clinician Portal' : 'Patient Medication Portal'}
              </div>
              <p className="auth-role-desc-card__text">
                {isDoctor
                  ? 'Monitor patient medication schedules, review prescriptions, and ensure safe treatment plans.'
                  : 'View your daily medicines, get timely dosage reminders, and easily keep your doctor updated.'}
              </p>
            </div>
          </div>

          {/* Primary Google Sign-In Action */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="auth-google-cta"
            aria-label={`Continue with Google as ${isDoctor ? 'Doctor' : 'Patient'}`}
          >
            {/* Google Official 4-Color Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
            <span>Continue with Google</span>
            <ArrowRight size={18} className="auth-google-cta__arrow" />
          </button>

          {/* Simple, Reassuring Trust Notice */}
          <div className="auth-security-explainer">
            <div className="auth-security-explainer__header">
              <ShieldCheck size={16} />
              <span>No Passwords to Remember</span>
            </div>
            <p className="auth-security-explainer__p">
              Sign in safely using your existing Google account. Your health data is completely confidential, encrypted, and visible only to you and your authorized healthcare providers.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="auth-badges-grid">
            <div className="auth-badge-card">
              <ShieldCheck size={16} color="#34D399" />
              <span>Confidential & Private</span>
            </div>
            <div className="auth-badge-card">
              <Lock size={16} color="#60A5FA" />
              <span>Instant Safe Login</span>
            </div>
          </div>

          <div className="auth-legal-footer">
            By signing in, you agree to HELIO&apos;s{' '}
            <a href="#terms">Terms of Service</a> and{' '}
            <a href="#privacy">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
