import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Pill, Scan, Bot, History, Mic, UserCheck, Stethoscope, LogOut, Moon, Sun, HeartPulse } from 'lucide-react';

export const PatientLayout = ({ user, token, theme, setTheme, onLogout }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview HUD', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Medication Hub', path: '/patient/medications', icon: Pill },
    { label: 'AI OCR Scanner', path: '/patient/scanner', icon: Scan },
    { label: 'Gemini Assistant', path: '/patient/ai-assistant', icon: Bot },
    { label: 'Health Timeline', path: '/patient/timeline', icon: History },
    { label: 'Voice Logger', path: '/patient/voice-logger', icon: Mic },
  ];

  return (
    <div className="app-container">
      {/* Floating Top HUD Header */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/patient/dashboard')}
          >
            <HeartPulse size={24} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>HELIO</span>
            <span className="nav-brand-badge">Patient Portal</span>
          </button>
        </div>

        <div className="nav-controls">
          {/* Quick Doctor Portal Switcher */}
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/doctor/dashboard')} title="Switch to Doctor View">
            <Stethoscope size={15} /> Switch to Doctor Portal
          </button>

          <button className="btn btn-outline btn-sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>
                {user.name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>PATIENT</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={onLogout} title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Patient Action Dock Sub-Navigation */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              <Icon size={16} /> {item.label}
            </NavLink>
          );
        })}
      </div>

      <main className="main-content" style={{ padding: '2rem 1.5rem', minHeight: 'calc(100vh - 160px)' }}>
        <Outlet context={{ token, user }} />
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
        HELIO Enterprise Medication Intelligence • Patient Portal Workspace • <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>HIPAA Compliant</span>
      </footer>
    </div>
  );
};

export default PatientLayout;
