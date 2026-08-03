import React, { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 400);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0F172A 0%, #0F4C81 60%, #0a3861 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
        gap: '2rem',
      }}
    >
      {/* HELIO Brand Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'splashFadeUp 0.6s ease-out both',
        }}
      >
        {/* EKG Pulse SVG */}
        <svg
          width="280"
          height="60"
          viewBox="0 0 280 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <path
            d="M0,30 L40,30 L55,30 L65,5 L75,55 L85,20 L95,40 L105,30 L145,30 L155,30 L165,8 L175,52 L185,18 L195,42 L205,30 L245,30 L255,30 L265,12 L275,48 L280,30"
            stroke="url(#ekgGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 600,
              strokeDashoffset: 600,
              animation: 'ekgDraw 1.4s ease-out 0.3s forwards',
            }}
          />
          <defs>
            <linearGradient id="ekgGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Brand Name */}
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            lineHeight: 1,
          }}
        >
          HELIO
        </div>
        <div
          style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Enterprise Medication Intelligence
        </div>
      </div>

      {/* Spinner Ring */}
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.15)',
          borderTop: '3px solid #10B981',
          borderRadius: '50%',
          animation: 'splashSpin 0.8s linear infinite',
        }}
      />

      <style>{`
        @keyframes splashSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes ekgDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
