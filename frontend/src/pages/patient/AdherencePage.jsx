import React, { useState } from 'react';
import {
  Activity,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Flame,
  HelpCircle,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Adherence Journal & Analytics Page (Pure React Styled)
 * ============================================================================
 */
export const AdherencePage = () => {
  // Calendar heatmap simulation (last 28 days)
  const days = Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1;
    // 92% adherence: only 2 days missed/late
    const status = dayNum === 11 ? 'missed' : dayNum === 19 ? 'late' : 'taken';
    return { dayNum, status };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
            Adherence Journal & Telemetry
          </h1>
          <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
            Auditable longitudinal intake records, biometric verification logs, and compliance scorecards.
          </p>
        </div>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.pill,
            padding: '9px 18px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            boxShadow: theme.shadows.subtle,
          }}
        >
          <Download size={15} />
          <span>Export Clinical Report (PDF)</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div
          style={{
            background: theme.colors.surfaceCard,
            borderRadius: theme.radii.xl,
            padding: '24px',
            border: `1px solid ${theme.colors.borderLight}`,
            boxShadow: theme.shadows.card,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
              30-Day Adherence Score
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: theme.colors.teal50, color: theme.colors.teal600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontFamily: theme.fonts.heading, fontSize: '2rem', fontWeight: 700, color: theme.colors.teal600, marginTop: '10px' }}>
            92.8%
          </div>
          <div style={{ fontSize: '0.76rem', color: theme.colors.textMuted, marginTop: '4px' }}>
            +4.2% improvement compared to previous month
          </div>
        </div>

        <div
          style={{
            background: theme.colors.surfaceCard,
            borderRadius: theme.radii.xl,
            padding: '24px',
            border: `1px solid ${theme.colors.borderLight}`,
            boxShadow: theme.shadows.card,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
              Current Streak
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(244, 63, 94, 0.12)', color: theme.colors.coral500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontFamily: theme.fonts.heading, fontSize: '2rem', fontWeight: 700, color: theme.colors.textPrimary, marginTop: '10px' }}>
            18 Days
          </div>
          <div style={{ fontSize: '0.76rem', color: theme.colors.textMuted, marginTop: '4px' }}>
            Longest recorded: 46 days (Cardiac protocol)
          </div>
        </div>

        <div
          style={{
            background: theme.colors.surfaceCard,
            borderRadius: theme.radii.xl,
            padding: '24px',
            border: `1px solid ${theme.colors.borderLight}`,
            boxShadow: theme.shadows.card,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
              Verification Source
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: theme.colors.indigo50, color: theme.colors.indigo600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.6rem', fontWeight: 700, color: theme.colors.textPrimary, marginTop: '10px' }}>
            Smart Pillbox
          </div>
          <div style={{ fontSize: '0.76rem', color: theme.colors.textMuted, marginTop: '4px' }}>
            Bluetooth hardware paired • 98% telemetric fidelity
          </div>
        </div>
      </div>

      {/* 28-Day Heatmap Bento Box */}
      <div
        style={{
          background: theme.colors.surfaceCard,
          borderRadius: theme.radii.xl,
          padding: '28px',
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadows.card,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: theme.fonts.heading, fontSize: '1.2rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
              28-Day Intake Consistency Matrix
            </h3>
            <p style={{ fontSize: '0.78rem', color: theme.colors.textMuted, margin: '2px 0 0 0' }}>
              Visualizing daily dosage execution across all active morning, midday, and evening prescriptions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '0.74rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: theme.colors.teal500 }} />
              <span>Full Intake</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: theme.colors.amber500 }} />
              <span>Delayed (&gt;2 hrs)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: theme.colors.coral500 }} />
              <span>Missed Dose</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {days.map((d) => (
            <div
              key={d.dayNum}
              style={{
                borderRadius: theme.radii.md,
                padding: '14px 10px',
                backgroundColor:
                  d.status === 'taken'
                    ? 'rgba(20, 184, 166, 0.12)'
                    : d.status === 'late'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                border:
                  d.status === 'taken'
                    ? `1px solid rgba(20, 184, 166, 0.3)`
                    : d.status === 'late'
                    ? `1px solid rgba(245, 158, 11, 0.3)`
                    : `1px solid rgba(244, 63, 94, 0.3)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.colors.textMuted }}>
                Day {d.dayNum}
              </span>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color:
                    d.status === 'taken'
                      ? theme.colors.teal800
                      : d.status === 'late'
                      ? theme.colors.amber700
                      : theme.colors.coral700,
                }}
              >
                {d.status === 'taken' ? '100%' : d.status === 'late' ? 'Delayed' : 'Missed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdherencePage;
