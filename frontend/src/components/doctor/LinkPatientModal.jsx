import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';

/**
 * ============================================================================
 * HELIO Doctor Station: Link Patient Modal (LinkPatientModal.jsx)
 * ============================================================================
 * 
 * Clinical Security Specifications:
 * - Input masking for 'HL-XXXX-XXXX' with automatic uppercase and unambiguous filtering.
 * - Brute-force lockout feedback: Tracks 5 attempts and displays 30-minute lockout timer.
 * - Success confirmation state with linked patient profile.
 * - Authenticated with /api/doctor/claim-patient via stateful Redis session.
 */
export function LinkPatientModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [linkedPatient, setLinkedPatient] = useState(null);

  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMessage('');
      setLinkedPatient(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setRemainingAttempts(5);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, lockoutSeconds]);

  // ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  /**
   * Input Masking & Unambiguous Character Filter
   * Enforces format: HL-XXXX-XXXX
   * Filters out: 0, O, 1, I, L
   */
  const handleInputChange = (e) => {
    const rawVal = e.target.value.toUpperCase();

    // Remove ambiguous characters [0, O, 1, I, L] and non-alphanumeric except hyphen
    let clean = rawVal.replace(/[^2-9A-HJ-KM-NP-Z-]/g, '');

    // Normalize if user is pasting or typing without 'HL-'
    if (!clean.startsWith('HL-')) {
      clean = clean.replace(/^-+/, '');
      if (clean.startsWith('HL')) {
        clean = 'HL-' + clean.slice(2);
      } else {
        clean = 'HL-' + clean;
      }
    }

    // Extract the alphanumeric payload after 'HL-'
    const payload = clean.slice(3).replace(/-/g, '');

    // Format as HL-XXXX-XXXX
    let formatted = 'HL-';
    if (payload.length > 0) {
      formatted += payload.slice(0, 4);
    }
    if (payload.length > 4) {
      formatted += '-' + payload.slice(4, 8);
    }

    // Maximum length of HL-XXXX-XXXX is 12
    setCode(formatted.slice(0, 12));
    setErrorMessage('');
  };

  /**
   * Submit Code to Backend Rate-Limited Endpoint
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length < 12) {
      setErrorMessage('Please enter a complete 8-character pairing code (HL-XXXX-XXXX).');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/doctor/claim-patient', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLinkedPatient(data.patient);
        if (onSuccess) {
          onSuccess(data.patient);
        }
      } else {
        if (data.code === 'RATE_LIMIT_LOCKOUT_TRIGGERED' || data.code === 'DOCTOR_LOCKOUT_ACTIVE') {
          setIsLockedOut(true);
          setLockoutSeconds(data.remainingLockoutSeconds || 1800);
          setRemainingAttempts(0);
          setErrorMessage(data.error || 'Clinical station locked out due to 5 consecutive failed attempts.');
        } else {
          if (typeof data.remainingAttempts === 'number') {
            setRemainingAttempts(data.remainingAttempts);
          }
          setErrorMessage(data.error || 'Invalid or expired pairing code.');
        }
      }
    } catch (err) {
      setErrorMessage('Network error while validating pairing token. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLockoutTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(12px)',
        padding: '20px',
        fontFamily: "'Outfit', sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#0B1120',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(59, 130, 246, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          color: '#F8FAFC',
        }}
      >
        {/* Top Decorative Border */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #38BDF8 0%, #3B82F6 50%, #1D4ED8 100%)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <KeyRound size={12} />
                Access Delegation
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              Link Patient via Pairing Code
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px 28px' }}>
          {linkedPatient ? (
            /* ===================================================================
               SUCCESS CONFIRMATION STATE
               =================================================================== */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#34D399',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
                Clinical Delegation Established
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '0 0 20px 0' }}>
                You now possess authorized physician access to this patient&apos;s active regimens and adherence telemetries.
              </p>

              <div
                style={{
                  background: 'rgba(17, 24, 43, 0.7)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'left',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {linkedPatient.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#60A5FA', marginTop: '2px' }}>
                      {linkedPatient.condition || 'General Regimen Supervision'}
                    </div>
                  </div>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                    }}
                  >
                    Adherence: {linkedPatient.adherenceRate || 94}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px -4px rgba(16, 185, 129, 0.4)',
                }}
              >
                Return to Cohort Directory
              </button>
            </div>
          ) : (
            /* ===================================================================
               CODE INPUT & BRUTE-FORCE DEFENSE STATE
               =================================================================== */
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                Enter the 8-character pairing code provided by the patient. The code is single-use and generated under cryptographic 24-hour expiration.
              </p>

              {/* Lockout Warning Banner */}
              {isLockedOut && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#F87171',
                  }}
                >
                  <Lock size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Clinical Station Locked</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '2px' }}>
                      5 failed redemption attempts exceeded. Lockout active for{' '}
                      <strong>{formatLockoutTimer(lockoutSeconds)}</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && !isLockedOut && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#F87171',
                    fontSize: '0.8rem',
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Code Input */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="pairing-code-input"
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94A3B8',
                    marginBottom: '8px',
                  }}
                >
                  Patient Pairing Token (HL-XXXX-XXXX)
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputRef}
                    id="pairing-code-input"
                    type="text"
                    value={code}
                    onChange={handleInputChange}
                    disabled={isLockedOut || isLoading}
                    placeholder="HL-••••-••••"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px 18px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: isLockedOut
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '14px',
                      color: '#FFFFFF',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      outline: 'none',
                      transition: 'border 0.2s',
                    }}
                  />
                </div>
              </div>

              {/* Attempts Counter Telemetry */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  color: remainingAttempts <= 2 ? '#F87171' : '#94A3B8',
                  marginBottom: '22px',
                  padding: '0 2px',
                }}
              >
                <span>Brute-Force Lockout Defense:</span>
                <span style={{ fontWeight: 600 }}>
                  Remaining attempts: {remainingAttempts}/5
                </span>
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading || isLockedOut || code.length < 12}
                  style={{
                    flex: 2,
                    padding: '13px',
                    borderRadius: '14px',
                    background:
                      isLockedOut || code.length < 12
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                    border: 'none',
                    color: isLockedOut || code.length < 12 ? '#64748B' : '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: isLockedOut || code.length < 12 ? 'not-allowed' : 'pointer',
                    boxShadow:
                      isLockedOut || code.length < 12
                        ? 'none'
                        : '0 6px 20px -4px rgba(59, 130, 246, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isLoading ? (
                    <span>Validating Redis Token...</span>
                  ) : (
                    <>
                      <span>Verify & Claim Access</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LinkPatientModal;
