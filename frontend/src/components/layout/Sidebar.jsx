import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Pill,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User,
  UserCheck,
  Users
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Modular Sidebar Component (Pure React Styled)
 * ============================================================================
 */
export const Sidebar = ({
  currentPortal,
  onPortalSwitch,
  currentRoute,
  onRouteChange,
  adherencePercentage = 75
}) => {
  // Patient Navigation Items
  const patientNavItems = [
    { id: 'routine', label: "Today's Routine", icon: Calendar, badge: '3 Due', badgeColor: theme.colors.teal400, badgeBg: 'rgba(20, 184, 166, 0.15)' },
    { id: 'medications', label: 'My Medications', icon: Pill, badge: '5 Active', badgeColor: '#94A3B8', badgeBg: 'rgba(148, 163, 184, 0.15)' },
    { id: 'adherence', label: 'Adherence Journal', icon: Activity },
    { id: 'interactions', label: 'Drug Safety & Radar', icon: ShieldAlert, badge: '1 Alert', badgeColor: '#FDA4AF', badgeBg: 'rgba(244, 63, 94, 0.2)' },
    { id: 'care-team', label: 'My Care Team', icon: UserCheck }
  ];

  // Clinician Navigation Items
  const doctorNavItems = [
    { id: 'clinical-overview', label: 'Clinical Overview', icon: LayoutDashboard },
    { id: 'patient-cohort', label: 'Patient Cohort', icon: Users, badge: '142 Active', badgeColor: '#94A3B8', badgeBg: 'rgba(148, 163, 184, 0.15)' },
    { id: 'prescriptions', label: 'Prescription Orders', icon: FileText, badge: '6 Pending', badgeColor: theme.colors.indigo500, badgeBg: 'rgba(99, 102, 241, 0.2)' },
    { id: 'toxicity-radar', label: 'Interaction Radar', icon: AlertTriangle, badge: '2 Critical', badgeColor: '#FDA4AF', badgeBg: 'rgba(244, 63, 94, 0.2)' },
    { id: 'analytics', label: 'Adherence Metrics', icon: BarChart3 }
  ];

  const navItems = currentPortal === 'patient' ? patientNavItems : doctorNavItems;

  return (
    <aside
      style={{
        width: '270px',
        backgroundColor: theme.colors.sidebarBg,
        color: theme.colors.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: `1px solid ${theme.colors.sidebarBorder}`,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        fontFamily: theme.fonts.body,
      }}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.colors.sidebarBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${theme.colors.indigo600} 0%, ${theme.colors.teal500} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
              color: '#FFFFFF',
            }}
          >
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: '1.22rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: theme.colors.textPrimary,
                lineHeight: 1.1,
              }}
            >
              HELIO
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.colors.teal400,
              }}
            >
              Med-Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Portal Mode Switcher */}
      <div style={{ padding: '14px 18px' }}>
        <div
          style={{
            background: theme.colors.sidebarSurface,
            border: `1px solid ${theme.colors.sidebarBorder}`,
            borderRadius: theme.radii.pill,
            padding: '4px',
            display: 'flex',
            gap: '4px',
          }}
          role="group"
          aria-label="Portal Selection"
        >
          <button
            type="button"
            onClick={() => onPortalSwitch('patient')}
            style={{
              flex: 1,
              background: currentPortal === 'patient' ? theme.colors.indigo600 : 'transparent',
              border: 'none',
              color: currentPortal === 'patient' ? '#FFFFFF' : theme.colors.sidebarText,
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: theme.radii.pill,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: theme.transitions.fast,
              boxShadow: currentPortal === 'patient' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
            }}
          >
            <User size={13} />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => onPortalSwitch('doctor')}
            style={{
              flex: 1,
              background: currentPortal === 'doctor' ? theme.colors.indigo600 : 'transparent',
              border: 'none',
              color: currentPortal === 'doctor' ? '#FFFFFF' : theme.colors.sidebarText,
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: theme.radii.pill,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: theme.transitions.fast,
              boxShadow: currentPortal === 'doctor' ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
            }}
          >
            <Stethoscope size={13} />
            <span>Clinician</span>
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748B',
            padding: '8px 12px 4px 12px',
          }}
        >
          {currentPortal === 'patient' ? 'Patient Care' : 'Clinical Ops'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onRouteChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: theme.radii.md,
                background: isActive ? theme.colors.sidebarActiveBg : 'transparent',
                color: isActive ? '#FFFFFF' : theme.colors.sidebarText,
                border: isActive ? `1px solid rgba(99, 102, 241, 0.3)` : '1px solid transparent',
                boxShadow: isActive ? `inset 2px 0 0 ${theme.colors.indigo500}` : 'none',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                width: '100%',
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.colors.sidebarText;
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} color={isActive ? theme.colors.indigo500 : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: theme.radii.pill,
                    color: item.badgeColor,
                    backgroundColor: item.badgeBg,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Adherence Progress Widget */}
      <div
        style={{
          margin: '12px 14px',
          padding: '14px',
          background: theme.colors.sidebarSurface,
          border: `1px solid ${theme.colors.sidebarBorder}`,
          borderRadius: theme.radii.lg,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ width: '44px', height: '44px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3.5" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={currentPortal === 'patient' ? theme.colors.teal400 : theme.colors.indigo500}
              strokeWidth="3.5"
              strokeDasharray="113.1"
              strokeDashoffset={113.1 - (113.1 * adherencePercentage) / 100}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF' }}>
            {adherencePercentage}%
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#CBD5E1' }}>
            {currentPortal === 'patient' ? "Today's Adherence" : "Cohort Compliance"}
          </span>
          <span style={{ fontSize: '0.7rem', color: theme.colors.teal400, fontWeight: 500 }}>
            {currentPortal === 'patient' ? '3 of 4 doses logged' : 'Low risk distribution'}
          </span>
        </div>
      </div>

      {/* User Footer */}
      <div
        style={{
          padding: '16px 14px',
          borderTop: `1px solid ${theme.colors.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: theme.radii.pill,
              background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {currentPortal === 'patient' ? 'EV' : 'AT'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F8FAFC', lineHeight: 1.2 }}>
              {currentPortal === 'patient' ? 'Elena Vance' : 'Dr. Aris Thorne'}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
              {currentPortal === 'patient' ? 'Patient #HL-8820' : 'Chief of Cardiology'}
            </span>
          </div>
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            padding: '6px',
            borderRadius: theme.radii.sm,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
