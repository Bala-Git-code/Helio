import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';

/**
 * ============================================================================
 * HELIO Patient Clinical Access Pairing Component (ShareAccessCode.jsx)
 * ============================================================================
 * 
 * Cryptographic Access Delegation:
 * - Displays active 24-hour pairing code (format: HL-XXXX-XXXX).
 * - Real-time 24-hour countdown ticker with dynamic telemetry bar.
 * - Single-click clipboard copying with visual confirmation.
 * - Authenticated with /api/patient/pairing-code via stateful Redis sessions.
 */
export function ShareAccessCode() {
  const [activeCode, setActiveCode] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch current active pairing code from backend Redis
   */
  const fetchActiveCode = useCallback(async () => {
    try {
      const response = await fetch('/api/patient/pairing-code', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.active && data.data.code) {
          setActiveCode(data.data.code);
          setRemainingSeconds(data.data.remainingSeconds || 0);
        } else {
          setActiveCode(null);
          setRemainingSeconds(0);
        }
      }
    } catch (err) {
      console.warn('[HELIO PAIRING] Failed to query code status:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchActiveCode();
  }, [fetchActiveCode]);

  /**
   * Live 1-second countdown ticker
   */
  useEffect(() => {
    if (!activeCode || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setActiveCode(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCode, remainingSeconds]);

  /**
   * Generate new 24-hour pairing code
   */
  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/patient/pairing-code', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setActiveCode(data.data.code);
        setRemainingSeconds(data.data.expiresInSeconds || 86400);
      } else {
        setError(data.error || 'Could not generate access code.');
      }
    } catch (err) {
      setError('Network connection interrupted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy to clipboard
   */
  const handleCopy = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Format remaining seconds into HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const percentRemaining = Math.min(100, Math.max(0, (remainingSeconds / 86400) * 100));

  return (
    <div
      style={{
        background: 'rgba(17, 24, 43, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.45), 0 0 24px -4px rgba(16, 185, 129, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        color: '#F8FAFC',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #10B981 0%, #059669 50%, #3B82F6 100%)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <KeyRound size={13} />
              Doctor Access Protocol
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            Physician Pairing Delegation
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '4px 0 0 0', lineHeight: 1.45 }}>
            Authorize a licensed physician to supervise your pharmacotherapy and regimen by providing this single-use code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateCode}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: activeCode ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: activeCode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            color: '#FFFFFF',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: activeCode ? 'none' : '0 6px 18px -4px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.25s ease',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
          <span>{activeCode ? 'Regenerate Code' : 'Generate Access Code'}</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: '#F87171',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Active Code Display Section */}
      {activeCode ? (
        <div
          style={{
            background: 'rgba(10, 15, 29, 0.7)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '18px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                Active Delegation Code (Base-32)
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  color: '#34D399',
                  textShadow: '0 0 16px rgba(52, 211, 153, 0.35)',
                  marginTop: '4px',
                }}
              >
                {activeCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '14px',
                background: copied ? '#059669' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${copied ? '#10B981' : 'rgba(16, 185, 129, 0.4)'}`,
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Pairing Code'}</span>
            </button>
          </div>

          {/* 24-Hour Countdown Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
                <Clock size={14} color="#34D399" />
                <span>Expires in: <strong style={{ color: '#F8FAFC' }}>{formatTime(remainingSeconds)}</strong></span>
              </span>
              <span style={{ color: '#64748B', fontWeight: 500 }}>
                Strict 24h Redis TTL
              </span>
            </div>

            {/* Countdown Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentRemaining}%`,
                  background: percentRemaining > 20 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #EF4444, #F87171)',
                  transition: 'width 1s linear',
                  borderRadius: '10px',
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            background: 'rgba(10, 15, 29, 0.5)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '18px',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
            }}
          >
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF' }}>
              No Active Clinician Code
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0', maxWidth: '380px' }}>
              Generate a high-entropy 24-hour delegation token to grant your physician clinical oversight of your regimen.
            </p>
          </div>
        </div>
      )}

      {/* Security Guidance Footer */}
      <div
        style={{
          marginTop: '18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.75rem',
          color: '#64748B',
          lineHeight: 1.45,
        }}
      >
        <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Cryptographic Delegation:</strong> Codes are single-use and permanently burnt once claimed. Only provide your code to certified medical professionals.
        </span>
      </div>

      <style>{`
        .spin-anim {
          animation: spin-icon 1s linear infinite;
        }
        @keyframes spin-icon {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ShareAccessCode;
