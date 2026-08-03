import React from 'react';
import { HeartPulse, Sun, Moon, LogOut, UserCheck, Stethoscope, Home } from 'lucide-react';

export const Navbar = ({
  user,
  onNavigate,
  appView,
  setAppView,
  theme,
  setTheme,
  onLogout,
  compact = false,
}) => {
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header className="navbar">
      {/* Brand */}
      <button
        className="nav-brand"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => onNavigate ? onNavigate(user ? (user.role === 'DOCTOR' ? 'doctor' : 'patient') : 'landing') : null}
      >
        <HeartPulse size={24} color="var(--primary)" />
        <span>HELIO</span>
        <span className="nav-brand-badge">Enterprise</span>
      </button>

      <div className="nav-controls">
        {/* Portal Switcher — only when authenticated */}
        {user && !compact && (
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <button
              className={`btn btn-sm ${appView === 'patient' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAppView('patient')}
            >
              <UserCheck size={15} /> Patient View
            </button>
            <button
              className={`btn btn-sm ${appView === 'doctor' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setAppView('doctor')}
            >
              <Stethoscope size={15} /> Doctor View
            </button>
          </div>
        )}

        {/* Back to Home — auth page only */}
        {!user && !compact && onNavigate && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate('landing')}
          >
            <Home size={15} /> Home
          </button>
        )}

        {/* Theme Toggle */}
        <button className="btn btn-outline btn-sm" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User Info + Logout */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                {user.name?.split(' ')[0]}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: user.role === 'DOCTOR' ? 'var(--secondary)' : 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {user.role}
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onLogout && onLogout()}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
