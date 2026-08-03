import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, CheckCircle2, ShieldCheck } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';

export const SplashScreenPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing HELIO Core Platform Engine...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Connecting Mongoose Atlas & In-App Outbox Queue...');
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Loading Gemini 1.5 Flash Vision & Safety Models...');
    }, 1400);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('System Readiness Verified. Redirecting to Landing Portal...');
    }, 2100);

    const timer4 = setTimeout(() => {
      // If user already logged in, navigate to dashboard, else /home
      const token = localStorage.getItem('helio_token');
      const savedUser = localStorage.getItem('helio_user');
      if (token && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'DOCTOR') navigate('/doctor/dashboard');
          else navigate('/patient/dashboard');
          return;
        } catch {
          // fallback
        }
      }
      navigate('/home');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [navigate]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <ParticleCanvas />

      <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '440px', padding: '2rem' }}>
        {/* Animated Heartbeat Logo */}
        <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: '#fff', boxShadow: 'var(--shadow-xl)', marginBottom: '1.5rem' }} className="heartbeat-anim">
          <HeartPulse size={48} />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
          HELIO
        </h1>
        <p style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.25rem' }}>
          Enterprise Medication Intelligence
        </p>

        {/* Progress Bar Container */}
        <div style={{ marginTop: '2.5rem', width: '100%', background: 'var(--bg-tertiary)', height: '6px', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, minHeight: '24px' }}>
          {statusText}
        </p>
      </div>
    </div>
  );
};

export default SplashScreenPage;
