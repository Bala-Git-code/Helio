import React from 'react';
import { Bell, ChevronRight, HelpCircle, Search, ShieldCheck } from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Modular TopHeader Component (Pure React Styled)
 * ============================================================================
 */
export const TopHeader = ({ currentPortal, currentTitle, alertCount = 1 }) => {
  return (
    <header
      style={{
        height: '76px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(8, 8, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 36px',
        fontFamily: theme.fonts.body,
      }}
      role="banner"
    >
      {/* Left: Breadcrumbs & Context Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: theme.colors.textMuted }}>
        <span>HELIO</span>
        <ChevronRight size={14} color="#CBD5E1" />
        <span style={{ color: theme.colors.textSecondary, fontWeight: 500 }}>
          {currentPortal === 'patient' ? 'Patient Portal' : 'Clinical Station'}
        </span>
        <ChevronRight size={14} color="#CBD5E1" />
        <span
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: '1.12rem',
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}
        >
          {currentTitle}
        </span>
      </div>

      {/* Center: Command Search Bar */}
      <div style={{ position: 'relative', width: '340px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.colors.textMuted,
            pointerEvents: 'none',
          }}
        />
        <input
          type="search"
          placeholder={
            currentPortal === 'patient'
              ? 'Search drugs, schedules, side-effects...'
              : 'Search patient by MRN, NDC, condition...'
          }
          style={{
            width: '100%',
            padding: '9px 42px 9px 40px',
            fontSize: '0.84rem',
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.pill,
            color: theme.colors.textPrimary,
            outline: 'none',
            boxShadow: theme.shadows.subtle,
            transition: theme.transitions.fast,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.indigo500;
            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.14)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.borderLight;
            e.target.style.boxShadow = theme.shadows.subtle;
          }}
          aria-label="Search"
        />
        <kbd
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#A1A1C0',
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right: Telemetry & Notification Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live EHR Telemetry Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: `1px solid rgba(16, 185, 129, 0.35)`,
            color: '#34D399',
            fontSize: '0.76rem',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: theme.radii.pill,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
            }}
          />
          <span>FHIR / EHR Synced</span>
        </div>

        {/* Alerts Bell */}
        <button
          type="button"
          style={{
            position: 'relative',
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            width: '40px',
            height: '40px',
            borderRadius: theme.radii.pill,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            boxShadow: theme.shadows.subtle,
            transition: theme.transitions.fast,
          }}
          aria-label={`${alertCount} clinical notifications`}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: theme.colors.coral500,
                border: '1.5px solid #FFFFFF',
              }}
            />
          )}
        </button>

        {/* Clinical Help */}
        <button
          type="button"
          style={{
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            width: '40px',
            height: '40px',
            borderRadius: theme.radii.pill,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            boxShadow: theme.shadows.subtle,
          }}
          aria-label="Clinical Protocol Guide"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
