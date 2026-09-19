import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Pill,
  Activity,
  ShieldAlert,
  UserCheck,
  Sparkles,
  LogOut,
  ArrowRightLeft,
  ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { theme } from '../theme/theme';
import { AiAssistantDrawer } from '../components/ai/AiAssistantDrawer';
import { HelioLogo } from '../components/common/HelioLogo';

/**
 * ============================================================================
 * HELIO Patient Portal Layout (Unified Cosmic Dark Theme)
 * ============================================================================
 */
export function PatientPortalLayout() {
  const { user, logout, switchRole, adherenceRate, streakDays } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const patientNavLinks = [
    { to: '/patient/dashboard', label: "Today's Routine", icon: Calendar, badge: '3 Due' },
    { to: '/patient/medications', label: 'Medication Cabinet', icon: Pill, badge: '5 Active' },
    { to: '/patient/interactions', label: 'Safety & Radar', icon: ShieldAlert, badge: '1 Advisory' },
    { to: '/patient/chat', label: 'AI Medication Chat', icon: Sparkles, badge: 'Live' },
    { to: '/patient/care-team', label: 'My Care Team', icon: UserCheck },
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
      {/* 1. Patient Sidebar */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#0A0B14',
          color: '#A1A1C0',
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
            onClick={() => navigate('/patient/dashboard')}
          >
            <HelioLogo
              variant="badge"
              size={38}
              badgeRadius={12}
              badgeGradient="linear-gradient(135deg, #059669 0%, #10B981 100%)"
              badgeShadow="0 4px 14px rgba(16, 185, 129, 0.35)"
            />
            <div>
              <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                HELIO
              </div>
              <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Patient Vitality OS
              </div>
            </div>
          </div>
        </div>

        {/* Patient Profile Card & Live Adherence Meter */}
        <div style={{ padding: '18px 18px 14px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'Patient'}
                style={{ width: 40, height: 40, borderRadius: '12px', objectFit: 'cover', border: '2px solid #10B981' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'Elena Rostova'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#A1A1C0' }}>{user?.condition || 'Type 2 Diabetes'}</div>
              </div>
            </div>

            {/* Adherence Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
              <span style={{ color: '#A1A1C0' }}>Routine Adherence</span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>{adherenceRate}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${adherenceRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64647A', padding: '6px 12px' }}>
            Daily Management
          </div>

          {patientNavLinks.map((item) => {
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
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isActive ? '#34D399' : '#A1A1C0',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#10B981' : '#64647A'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#34D399' : '#A1A1C0',
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
              switchRole('doctor');
              navigate('/doctor/dashboard');
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
            <ArrowRightLeft size={14} color="#06B6D4" />
            <span>Switch to Clinician View</span>
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

      {/* 2. Main Viewport & Dynamic Outlet */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#08080F' }}>
        {/* Top Floating Header */}
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
              Welcome back, {user?.name?.split(' ')[0] || 'Elena'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#A1A1C0', margin: '2px 0 0 0' }}>
              All morning prescriptions confirmed · Next dose at 1:00 PM (Metformin 500mg)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#FBBF24',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <span>🔥</span>
              <span>{streakDays}-Day Routine Streak</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34D399',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <span>⚡</span>
              <span>{adherenceRate}% Adherence</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAiDrawerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(139, 92, 246, 0.45)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <Sparkles size={16} />
              <span>Ask Helio AI</span>
            </button>
          </div>
        </header>

        {/* 3. Nested Page Content via <Outlet /> */}
        <main style={{ flex: 1, padding: '32px 36px 64px', maxWidth: '1500px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* 4. Global Floating AI Assistant Drawer */}
      <AiAssistantDrawer isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
    </div>
  );
}

export default PatientPortalLayout;
