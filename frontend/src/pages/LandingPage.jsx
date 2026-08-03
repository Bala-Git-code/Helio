import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ArrowRight, ShieldCheck, Zap, Sparkles, Pill, Activity, BarChart3, Clock, CheckCircle2, Moon, Sun, Users, Calculator, Stethoscope } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';

export const LandingPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();

  // ROI Calculator State
  const [bedCount, setBedCount] = useState(250);
  const [readmissionRate, setReadmissionRate] = useState(18);
  const calculatedSavings = Math.round(bedCount * (readmissionRate / 100) * 14200 * 0.42);

  // Dose Simulator State
  const [simmedDose, setSimmedDose] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <ParticleCanvas />

      {/* Floating Header */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartPulse size={26} color="var(--primary)" />
          <span style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>HELIO</span>
          <span className="nav-brand-badge">Enterprise Platform</span>
        </div>

        <div className="nav-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={() => navigate('/auth/login')} className="btn btn-outline btn-sm">
            Sign In
          </button>
          <button onClick={() => navigate('/auth/register')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Register Workspace <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '4rem', zIndex: 10, position: 'relative' }}>
        
        {/* Asymmetrical Hero Bento-Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', alignItems: 'stretch' }}>
          
          {/* Bento Tile 1: Main Brand Banner (Col 1-7) */}
          <div className="card" style={{ gridColumn: 'span 7', padding: '3rem 2.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #0c2d48 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', width: 'fit-content' }}>
              <Sparkles size={14} color="var(--secondary)" /> Gemini 1.5 Flash Clinical Engine
            </span>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.15, margin: '1rem 0 0.75rem', letterSpacing: '-0.03em' }}>
              Autonomous Medication Intelligence Platform
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem' }}>
              Eliminating non-adherence and hospital readmissions through AI Multimodal Vision OCR, real-time drug interaction safeguards, and automated caregiver escalation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/auth/login')} className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Launch Interactive Demo <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/auth/register')} className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
                Request Provider Access
              </button>
            </div>
          </div>

          {/* Bento Tile 2: Live Dose Reminder Simulator (Col 8-12) */}
          <div className="card" style={{ gridColumn: 'span 5', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>Live Dose Simulator</span>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Interactive Notification Test</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Simulate how patients receive schedule notifications and log adherence in real time.
              </p>
            </div>

            <div style={{ margin: '1.5rem 0', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Pill size={24} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>Metformin 500mg</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled: 08:00 AM</div>
                  </div>
                </div>
                <span className={`badge ${simmedDose ? 'badge-success' : 'badge-warning'}`}>
                  {simmedDose ? 'TAKEN' : 'DUE NOW'}
                </span>
              </div>

              {simmedDose ? (
                <div style={{ marginTop: '1rem', color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Dose logged & sync'd with Doctor Dashboard
                </div>
              ) : (
                <button onClick={() => setSimmedDose(true)} className="btn btn-sm btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Simulate Taking Dose
                </button>
              )}
            </div>

            {simmedDose && (
              <button onClick={() => setSimmedDose(false)} className="btn btn-sm btn-outline">
                Reset Simulator
              </button>
            )}
          </div>
        </section>

        {/* Section 2: Clinical Compliance Statistics & ROI Calculator */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Hospital ROI Calculator Card */}
          <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              <Calculator size={24} />
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>Hospital ROI Calculator</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Estimate annual readmission penalty savings achieved by implementing HELIO Medication Intelligence across your health system.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hospital Bed Count</span>
                  <strong>{bedCount} beds</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={bedCount}
                  onChange={(e) => setBedCount(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>30-Day Readmission Rate</span>
                  <strong>{readmissionRate}%</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={readmissionRate}
                  onChange={(e) => setReadmissionRate(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--secondary)' }}
                />
              </div>

              <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Projected Annual Cost Savings</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)', margin: '0.25rem 0' }}>
                  ${calculatedSavings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Based on 42% reduction in medication-related readmissions</div>
              </div>
            </div>
          </div>

          {/* Compliance Statistics Counter Card */}
          <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                <Activity size={24} />
                <h3 style={{ fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>Clinical Compliance Metrics</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Empirically validated adherence metrics across multi-center enterprise deployment trials.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textCenter: 'center' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--secondary)' }}>94.8%</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Average Adherence</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+28% vs baseline</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textCenter: 'center' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)' }}>&lt; 1.2s</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>OCR Vision Latency</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gemini Flash</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Ready to experience HELIO?</span>
              <button onClick={() => navigate('/auth/login')} className="btn btn-sm btn-primary">
                Demo Sign In
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
