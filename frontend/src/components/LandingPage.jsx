import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Shield, Brain, Smartphone, ArrowRight, Zap,
  ChevronRight, Star, Lock, Sun, Moon, Pill, HeartPulse,
  ClipboardList, MessageSquare, UserCheck, Stethoscope
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, color, title, description, tag, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      <div
        className="feature-icon-wrap"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={28} color={color} />
      </div>
      <div className="feature-tag" style={{ color, background: `${color}15` }}>{tag}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
};

const StatBadge = ({ value, label }) => (
  <div className="stat-badge">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export const LandingPage = ({ onNavigate, theme, setTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* ── Sticky Header ── */}
      <header className={`landing-header ${scrolled ? 'landing-header-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="nav-brand" style={{ textDecoration: 'none' }}>
            <HeartPulse size={24} color="var(--primary)" />
            <span>HELIO</span>
            <span className="nav-brand-badge">Enterprise</span>
          </div>

          <nav className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#network" className="landing-nav-link">Doctor Network</a>
            <a href="#safety" className="landing-nav-link">AI Safety</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('auth')}>
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('auth')}>
              Register <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-bg-orb hero-orb-3" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Trusted by 12,000+ patients across 40+ clinics
          </div>

          <h1 className="hero-headline">
            Closing the
            <span className="hero-gradient-text"> Medication Adherence Gap</span>
            <br />with Clinical AI
          </h1>

          <p className="hero-subheadline">
            HELIO combines Gemini 1.5 Flash multimodal intelligence, real-time adherence tracking,
            and consent-driven doctor workspaces into one secure, enterprise-grade health platform.
          </p>

          <div className="hero-cta-group">
            <button
              className="btn btn-primary hero-btn-primary"
              onClick={() => onNavigate('auth')}
            >
              <UserCheck size={20} /> Patient Portal
              <ChevronRight size={18} />
            </button>
            <button
              className="btn hero-btn-doctor"
              onClick={() => onNavigate('auth')}
            >
              <Stethoscope size={20} /> Doctor Workspace
              <ChevronRight size={18} />
            </button>
            <button
              className="btn btn-outline hero-btn-demo"
              onClick={() => onNavigate('auth')}
            >
              <Zap size={18} color="#F59E0B" /> Try Instant Demo
            </button>
          </div>

          {/* Stats Row */}
          <div className="hero-stats">
            <StatBadge value="98.2%" label="Uptime SLA" />
            <div className="hero-stat-divider" />
            <StatBadge value="4.9★" label="Patient Rating" />
            <div className="hero-stat-divider" />
            <StatBadge value="< 200ms" label="API Response" />
            <div className="hero-stat-divider" />
            <StatBadge value="HIPAA" label="Compliant" />
          </div>
        </div>

        {/* App Preview Card */}
        <div className="hero-preview-wrap">
          <div className="hero-preview-card">
            <div className="preview-header">
              <div className="preview-dot preview-dot-red" />
              <div className="preview-dot preview-dot-amber" />
              <div className="preview-dot preview-dot-green" />
              <span className="preview-label">HELIO Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-metric-row">
                <div className="preview-metric">
                  <div className="preview-metric-value" style={{ color: '#10B981' }}>87%</div>
                  <div className="preview-metric-label">Adherence Score</div>
                </div>
                <div className="preview-metric">
                  <div className="preview-metric-value" style={{ color: '#F59E0B' }}>12</div>
                  <div className="preview-metric-label">Day Streak</div>
                </div>
                <div className="preview-metric">
                  <div className="preview-metric-value" style={{ color: '#0F4C81' }}>3</div>
                  <div className="preview-metric-label">Active Meds</div>
                </div>
              </div>
              {[
                { name: 'Metformin 500mg', time: '08:00 AM', status: 'TAKEN', pct: 72 },
                { name: 'Lisinopril 10mg', time: '08:00 AM', status: 'TAKEN', pct: 60 },
                { name: 'Atorvastatin 20mg', time: '09:00 PM', status: 'DUE', pct: 20 },
              ].map((med, i) => (
                <div key={i} className="preview-med-row">
                  <Pill size={14} color={med.status === 'TAKEN' ? '#10B981' : '#F59E0B'} />
                  <div style={{ flex: 1 }}>
                    <div className="preview-med-name">{med.name}</div>
                    <div className="preview-bar-bg">
                      <div
                        className="preview-bar-fill"
                        style={{
                          width: `${med.pct}%`,
                          background: med.status === 'TAKEN'
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="preview-status-tag"
                    style={{
                      background: med.status === 'TAKEN' ? '#d1fae5' : '#fef3c7',
                      color: med.status === 'TAKEN' ? '#059669' : '#d97706',
                    }}
                  >
                    {med.status}
                  </span>
                </div>
              ))}
              <div className="preview-ai-badge">
                <Brain size={12} />
                Gemini AI Safety Engine Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Showcase ── */}
      <section id="features" className="features-section">
        <div className="section-label">Platform Capabilities</div>
        <h2 className="section-headline">
          Every tool your clinical journey needs
        </h2>
        <p className="section-sub">
          Built on a zero-trust architecture with end-to-end encryption. Every feature
          is designed with clinical-grade reliability and patient safety as the north star.
        </p>

        <div className="features-grid">
          <FeatureCard
            icon={Pill}
            color="#0F4C81"
            tag="Core Tracking"
            title="Smart Medication Tracking & Refill Forecasting"
            description="AI-powered supply decay engine predicts your exact refill date. Get automated WhatsApp alerts before you run out. Full dose timeline with one-tap Take/Skip logging."
            delay={0}
          />
          <FeatureCard
            icon={MessageSquare}
            color="#10B981"
            tag="WhatsApp Integration"
            title="Interactive Meta WhatsApp Reminders"
            description="Receive dose reminder cards directly in WhatsApp. Reply with a single tap to confirm or skip. Caregiver escalation triggers automatically on missed doses."
            delay={100}
          />
          <FeatureCard
            icon={Brain}
            color="#7C3AED"
            tag="Gemini 1.5 Flash"
            title="Multimodal OCR Prescription Scanner"
            description="Drag and drop any prescription image or PDF. Gemini Vision extracts medication name, dosage, and instructions in under 3 seconds and auto-fills your medication form."
            delay={200}
          />
          <FeatureCard
            icon={Shield}
            color="#EF4444"
            tag="Clinical Safety"
            title="Consent-Based Doctor Workspace & DDI Engine"
            description="Doctors request secure consent to access patient records. Gemini AI checks every new prescription for dangerous drug-drug interactions before any medication is saved."
            delay={300}
          />
        </div>
      </section>

      {/* ── Doctor Network Section ── */}
      <section id="network" className="network-section">
        <div className="network-inner">
          <div className="network-text">
            <div className="section-label" style={{ textAlign: 'left' }}>Doctor Network</div>
            <h2 className="section-headline" style={{ textAlign: 'left', fontSize: '2.2rem' }}>
              A clinical workspace built for real-world practice
            </h2>
            <p className="section-sub" style={{ textAlign: 'left' }}>
              Physicians get a powerful command center: patient adherence dashboards,
              consent-gated record access, and AI-assisted prescription writing with
              real-time drug interaction safety checks.
            </p>
            <ul className="network-list">
              {[
                'Patient Consent Link Generator',
                'Real-time Adherence Monitor & Escalation Flags',
                'AI-Powered Drug Interaction Safety Engine',
                'Prescription Builder with Clinical Audit Log',
                'Caregiver Contact & Emergency Escalation',
              ].map((item, i) => (
                <li key={i} className="network-list-item">
                  <div className="network-check">
                    <Star size={12} color="#10B981" fill="#10B981" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onNavigate('auth')}>
              Access Doctor Workspace <ArrowRight size={16} />
            </button>
          </div>
          <div className="network-visual">
            <div className="network-card-stack">
              {[
                { name: 'Sarah Jenkins', score: 87, flag: false, email: 'patient@helio.health' },
                { name: 'Marcus Oduya', score: 62, flag: true, email: 'marcus.o@example.com' },
                { name: 'Priya Sharma', score: 95, flag: false, email: 'priya.s@example.com' },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`network-patient-card ${p.flag ? 'network-card-flag' : ''}`}
                  style={{ transform: `translateY(${i * -8}px) scale(${1 - i * 0.02})`, zIndex: 3 - i }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                    </div>
                    <div
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: p.score >= 80 ? '#10B981' : '#EF4444',
                      }}
                    >
                      {p.score}%
                    </div>
                  </div>
                  {p.flag && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#EF4444', fontWeight: 700 }}>
                      ⚠ ATTENTION: 3 consecutive missed doses
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Safety Section ── */}
      <section id="safety" className="safety-section">
        <div className="safety-badge">
          <Lock size={14} /> Zero-Trust Security Architecture
        </div>
        <h2 className="section-headline" style={{ color: '#ffffff' }}>
          Clinical AI you can trust
        </h2>
        <p className="section-sub" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px', margin: '0 auto 2.5rem' }}>
          Every interaction is end-to-end encrypted. Gemini AI operates on anonymized
          data. No medication history is ever shared without explicit patient consent.
        </p>
        <div className="safety-grid">
          {[
            { icon: Shield, label: 'HIPAA Compliant', desc: 'Full audit trail on all PHI access' },
            { icon: Brain, label: 'Gemini 1.5 Flash', desc: 'Multimodal AI for clinical accuracy' },
            { icon: Lock, label: 'JWT + HTTPS', desc: 'Zero plaintext credentials in transit' },
            { icon: Activity, label: '99.8% Uptime', desc: 'Enterprise SLA with auto-failover' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="safety-item">
              <Icon size={32} color="#10B981" />
              <div className="safety-item-label">{label}</div>
              <div className="safety-item-desc">{desc}</div>
            </div>
          ))}
        </div>
        <button
          className="btn"
          style={{
            marginTop: '2.5rem',
            background: 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            padding: '0.8rem 2rem',
            fontSize: '1rem',
          }}
          onClick={() => onNavigate('auth')}
        >
          Get Started Free <ArrowRight size={16} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <HeartPulse size={20} color="var(--primary)" />
          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>HELIO</span>
          <span className="nav-brand-badge">Enterprise</span>
        </div>
        <div className="landing-footer-links">
          <button className="landing-footer-link" onClick={() => onNavigate('auth')}>Sign In</button>
          <button className="landing-footer-link" onClick={() => onNavigate('auth')}>Register</button>
          <a href="#features" className="landing-footer-link">Features</a>
          <a href="#safety" className="landing-footer-link">Security</a>
        </div>
        <div className="landing-footer-compliance">
          <span>🔒 HIPAA Compliant</span>
          <span>•</span>
          <span>⚡ Powered by Gemini 1.5 Flash</span>
          <span>•</span>
          <span>🛡 Zero-Trust Architecture</span>
          <span>•</span>
          <span>© 2026 HELIO Platform</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
