import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Stethoscope,
  LogOut,
  ArrowRightLeft,
  ShieldAlert,
  Activity,
  Bell,
  Search,
} from 'lucide-react';
import { theme } from '../theme/theme';

/**
 * ============================================================================
 * HELIO Doctor Portal Layout (Unified Cosmic Dark Theme)
 * ============================================================================
 */
export function DoctorPortalLayout() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const doctorNavLinks = [
    { to: '/doctor/dashboard', label: 'Clinical Overview', icon: LayoutDashboard },
    { to: '/doctor/patients', label: 'Patient Cohort', icon: Users, badge: '148 Active' },
    { to: '/doctor/prescriptions', label: 'Prescription Orders', icon: FileText, badge: '6 Due' },
    { to: '/doctor/alerts', label: 'Safety & Toxicity Radar', icon: AlertTriangle, badge: '2 Critical', badgeColor: '#FB7185' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#08080F',
        color: '#FFFFFF',
        fontFamily: theme.fonts.body,
        position: 'relative',
      }}
    >
      {/* 1. Clinician High-Density Dark Sidebar */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#0A0B14',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => navigate('/doctor/dashboard')}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Stethoscope size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                HELIO
              </div>
              <div style={{ fontSize: '0.68rem', color: '#8B5CF6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Clinical Command
              </div>
            </div>
          </div>
        </div>

        {/* Clinician Profile Badge */}
        <div style={{ padding: '18px 18px 14px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                alt={user?.name || 'Clinician'}
                style={{ width: 40, height: 40, borderRadius: '12px', objectFit: 'cover', border: '2px solid #8B5CF6' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'Dr. Julian Vance, MD'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#A1A1C0' }}>{user?.specialty || 'Pharmacotherapy'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <div style={{ flex: 1, background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', padding: '6px 8px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#A78BFA' }}>148</div>
                <div style={{ fontSize: '0.65rem', color: '#A1A1C0', textTransform: 'uppercase' }}>Patients</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(244, 63, 94, 0.12)', borderRadius: '8px', padding: '6px 8px', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FB7185' }}>2</div>
                <div style={{ fontSize: '0.65rem', color: '#A1A1C0', textTransform: 'uppercase' }}>Critical</div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinician Navigation */}
        <nav style={{ flex: 1, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64647A', padding: '6px 12px' }}>
            Clinical Operations
          </div>

          {doctorNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                  color: isActive ? '#C4B5FD' : '#A1A1C0',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#8B5CF6' : '#64647A'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: item.badgeColor ? 'rgba(244, 63, 94, 0.15)' : (isActive ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)'),
                      color: item.badgeColor || (isActive ? '#C4B5FD' : '#A1A1C0'),
                      border: item.badgeColor ? '1px solid rgba(244, 63, 94, 0.35)' : 'none',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions: Switch Role & Logout */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              switchRole('patient');
              navigate('/patient/dashboard');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#A1A1C0',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#A1A1C0'; }}
          >
            <ArrowRightLeft size={14} color="#10B981" />
            <span>Switch to Patient View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'transparent',
              border: 'none',
              color: '#FB7185',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Clinician Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#08080F' }}>
        {/* Clinician Command Ribbon Header */}
        <header
          style={{
            height: '74px',
            backgroundColor: 'rgba(8, 8, 15, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 36px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Physician Triage & Monitoring Console
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#A1A1C0', margin: '2px 0 0 0' }}>
              Real-time Pharmacovigilance Network · Active Session: Dr. Julian Vance, MD
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Quick Cohort Triage Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '9999px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                color: '#FB7185',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <ShieldAlert size={15} />
              <span>2 High-Risk Alerts Active</span>
            </div>
          </div>
        </header>

        {/* 3. Nested Page Content via <Outlet /> */}
        <main style={{ flex: 1, padding: '32px 36px 64px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DoctorPortalLayout;
