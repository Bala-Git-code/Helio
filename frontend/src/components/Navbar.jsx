import React from 'react';
import { Activity, Sun, Moon, LogOut, UserCheck, Stethoscope } from 'lucide-react';

export const Navbar = ({ user, activePortal, setActivePortal, theme, setTheme, onLogout }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <Activity size={26} color="var(--primary)" />
        <span>HELIO</span>
        <span className="nav-brand-badge">Enterprise</span>
      </div>

      <div className="nav-controls">
        {user && (
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <button
              className={`btn btn-sm ${activePortal === 'patient' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActivePortal('patient')}
            >
              <UserCheck size={16} /> Patient View
            </button>
            <button
              className={`btn btn-sm ${activePortal === 'doctor' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setActivePortal('doctor')}
            >
              <Stethoscope size={16} /> Doctor View
            </button>
          </div>
        )}

        <button className="btn btn-outline btn-sm" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
