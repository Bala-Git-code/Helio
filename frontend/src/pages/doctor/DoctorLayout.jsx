import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FilePlus, BarChart3, UserCheck, Stethoscope, LogOut, Moon, Sun, HeartPulse } from 'lucide-react';

export const DoctorLayout = ({ user, token, theme, setTheme, onLogout }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Clinical Overview', path: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Patient Directory', path: '/doctor/patients', icon: Users },
    { label: 'Prescription Builder', path: '/doctor/prescribe', icon: FilePlus },
    { label: 'Cohort Analytics', path: '/doctor/analytics', icon: BarChart3 },
  ];

  return (
    <div className="app-container">
      {/* Floating Top HUD Header */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/doctor/dashboard')}
          >
            <HeartPulse size={24} color="var(--secondary)" />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>HELIO</span>
            <span className="nav-brand-badge" style={{ background: 'var(--secondary-light)', color: 'var(--secondary-hover)' }}>Doctor Portal</span>
          </button>
        </div>

        <div className="nav-controls">
          {/* Switch to Patient View */}
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/patient/dashboard')} title="Switch to Patient View">
            <UserCheck size={15} /> Switch to Patient Portal
          </button>

          <button className="btn btn-outline btn-sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>
                {user.name?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>DOCTOR</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={onLogout} title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Doctor Sub-Navigation Dock */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-secondary' : 'btn-outline'}`}
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
        HELIO Enterprise Medication Intelligence • Doctor Portal Workspace • <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>HIPAA Compliant</span>
      </footer>
    </div>
  );
};

export default DoctorLayout;
