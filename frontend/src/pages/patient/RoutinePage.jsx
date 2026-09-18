import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Pill,
  Plus,
  RotateCw,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

/**
 * ============================================================================
 * HELIO Patient Routine Page (Asymmetrical Bento-Box Adherence Dashboard)
 * ============================================================================
 */
export const RoutinePage = ({ onAdherenceChange }) => {
  const { updateAdherenceRate } = useAuth();

  // Dose Timeline State with Interactive Action
  const [doses, setDoses] = useState([
    {
      id: 'd1',
      medication: 'Metformin Hydrochloride',
      strength: '500 mg',
      type: 'Oral Tablet',
      scheduledTime: '08:00 AM',
      takenTime: '08:12 AM',
      instructions: 'Take with morning meal',
      status: 'taken',
      color: theme.colors.teal500,
      prescriber: 'Dr. Sarah Jenkins',
    },
    {
      id: 'd2',
      medication: 'Lisinopril',
      strength: '10 mg',
      type: 'Oral Tablet',
      scheduledTime: '08:00 AM',
      takenTime: '08:14 AM',
      instructions: 'Take with full glass of water',
      status: 'taken',
      color: theme.colors.indigo500,
      prescriber: 'Dr. Aris Thorne',
    },
    {
      id: 'd3',
      medication: 'Omega-3 Acid Ethyl Esters',
      strength: '1,000 mg',
      type: 'Softgel Capsule',
      scheduledTime: '01:00 PM',
      takenTime: '01:05 PM',
      instructions: 'Take during or after lunch',
      status: 'taken',
      color: theme.colors.amber500,
      prescriber: 'Dr. Aris Thorne',
    },
    {
      id: 'd4',
      medication: 'Atorvastatin Calcium',
      strength: '20 mg',
      type: 'Oral Tablet',
      scheduledTime: '09:00 PM',
      takenTime: null,
      instructions: 'Take before bed. Avoid grapefruit.',
      status: 'pending',
      color: theme.colors.amethyst500,
      prescriber: 'Dr. Aris Thorne',
    },
  ]);

  const toggleDose = (id) => {
    const updated = doses.map((d) => {
      if (d.id === id) {
        const nextStatus = d.status === 'taken' ? 'pending' : 'taken';
        const nextTakenTime =
          nextStatus === 'taken'
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;
        return { ...d, status: nextStatus, takenTime: nextTakenTime };
      }
      return d;
    });

    setDoses(updated);
    const takenCount = updated.filter((d) => d.status === 'taken').length;
    const percentage = Math.round((takenCount / updated.length) * 100);
    if (onAdherenceChange) onAdherenceChange(percentage);
    if (updateAdherenceRate) updateAdherenceRate(percentage);
  };

  const takenCount = doses.filter((d) => d.status === 'taken').length;
  const adherencePct = Math.round((takenCount / doses.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: theme.fonts.body }}>
      {/* --------------------------------------------------------------------
          1. TOP BENTO ROW: HERO SUMMARY & NEXT DOSE COUNTDOWN
          -------------------------------------------------------------------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Bento Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(13, 14, 26, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: theme.radii.xl,
            padding: '28px 32px',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Decorative Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <div style={{ zIndex: 2, maxWidth: '65%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '3px 10px',
                  borderRadius: theme.radii.pill,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                Routine On Track
              </span>
              <span style={{ fontSize: '0.78rem', color: '#A1A1C0' }}>
                Tuesday, Sep 15 • Week 37
              </span>
            </div>
            <h1
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: '1.85rem',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.2,
                marginBottom: '8px',
              }}
            >
              Good morning, Elena.
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#A1A1C0', lineHeight: 1.5, margin: 0 }}>
              You've completed <strong style={{ color: '#FFFFFF' }}>{takenCount} of {doses.length} scheduled doses</strong> today. Your next target is evening Atorvastatin at 9:00 PM.
            </p>
          </div>

          {/* Adherence Circular Metric */}
          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray="263.9"
                  strokeDashoffset={263.9 - (263.9 * adherencePct) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: theme.fonts.heading, fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                  {adherencePct}%
                </span>
                <span style={{ fontSize: '0.62rem', color: '#A1A1C0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Adherence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Next Dose Countdown */}
        <div
          style={{
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.xl,
            padding: '24px',
            boxShadow: theme.shadows.card,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
              Upcoming Target
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: theme.colors.amethyst50,
                color: theme.colors.amethyst600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={16} />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.4rem', fontWeight: 700, color: theme.colors.textPrimary }}>
              09:00 PM
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: theme.colors.indigo600, marginTop: '2px' }}>
              Atorvastatin 20mg
            </div>
            <div style={{ fontSize: '0.74rem', color: theme.colors.textMuted, marginTop: '4px' }}>
              Scheduled in ~3.5 hours
            </div>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.surfaceGroundWarm,
              fontSize: '0.72rem',
              color: theme.colors.textSecondary,
            }}
          >
            💡 Reminder: Take with water before bed
          </div>
        </div>

        {/* Bento Card 3: Adherence Streak & Vitality */}
        <div
          style={{
            background: theme.colors.surfaceCard,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.xl,
            padding: '24px',
            boxShadow: theme.shadows.card,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.textMuted }}>
              Clinical Streak
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                color: theme.colors.coral500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={18} />
            </div>
          </div>

          <div>
            <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 700, color: theme.colors.textPrimary }}>
              18 Days
            </div>
            <div style={{ fontSize: '0.78rem', color: theme.colors.teal600, fontWeight: 600, marginTop: '2px' }}>
              Perfect Evening Regimen
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  backgroundColor: i < 5 ? theme.colors.teal100 : theme.colors.surfaceGroundWarm,
                  color: i < 5 ? theme.colors.teal800 : theme.colors.textMuted,
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. DRUG SAFETY WARNING BANNER (Interactive Anti-Generic Card)
          -------------------------------------------------------------------- */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(13, 14, 26, 0.9) 100%)',
          border: `1px solid rgba(245, 158, 11, 0.35)`,
          borderRadius: theme.radii.lg,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FBBF24' }}>
              Dietary Interaction Advisory: Atorvastatin & Grapefruit
            </div>
            <div style={{ fontSize: '0.76rem', color: '#FDE68A', marginTop: '2px' }}>
              Grapefruit alters statin bioavailability via intestinal CYP3A4 inhibition. Please avoid consuming grapefruit within 12 hours of evening dosing.
            </div>
          </div>
        </div>

        <button
          type="button"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: theme.radii.pill,
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#FBBF24',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          View Clinical Note
        </button>
      </div>

      {/* --------------------------------------------------------------------
          3. TODAY'S DOSE TIMELINE (Interactive Verification)
          -------------------------------------------------------------------- */}
      <div
        style={{
          background: theme.colors.surfaceCard,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.radii.xl,
          padding: '28px',
          boxShadow: theme.shadows.card,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '22px',
          }}
        >
          <div>
            <h2 style={{ fontFamily: theme.fonts.heading, fontSize: '1.24rem', fontWeight: 700, margin: 0 }}>
              Prescribed Schedule & Adherence Verification
            </h2>
            <p style={{ fontSize: '0.78rem', color: theme.colors.textMuted, margin: '3px 0 0 0' }}>
              Click the checkmark button to log taken doses in real time. Timestamps are cryptographically signed to EHR logs.
            </p>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: theme.colors.indigo600,
              backgroundColor: theme.colors.indigo50,
              padding: '6px 14px',
              borderRadius: theme.radii.pill,
            }}
          >
            FHIR v4 Synchronized
          </span>
        </div>

        {/* Dose Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {doses.map((dose) => {
            const isTaken = dose.status === 'taken';

            return (
              <div
                key={dose.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: theme.radii.lg,
                  border: isTaken
                    ? `1px solid rgba(20, 184, 166, 0.25)`
                    : `1px solid ${theme.colors.borderLight}`,
                  backgroundColor: isTaken ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.035)',
                  transition: theme.transitions.fast,
                }}
              >
                {/* Time & Drug Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Scheduled Time Pillar */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '70px',
                      paddingRight: '14px',
                      borderRight: `2px solid ${isTaken ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {dose.scheduledTime}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: theme.colors.textMuted }}>
                      {dose.scheduledTime.includes('AM') ? 'Morning' : 'Evening'}
                    </span>
                  </div>

                  {/* Drug Icon */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: isTaken ? theme.colors.teal100 : theme.colors.surfaceGroundWarm,
                      color: isTaken ? theme.colors.teal700 : dose.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Pill size={20} />
                  </div>

                  {/* Drug Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.96rem', fontWeight: 700, color: theme.colors.textPrimary }}>
                        {dose.medication}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '1px 8px',
                          borderRadius: theme.radii.pill,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#A1A1C0',
                        }}
                      >
                        {dose.strength}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: theme.colors.textMuted }}>
                        ({dose.type})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: theme.colors.textSecondary, marginTop: '3px' }}>
                      {dose.instructions} • <span style={{ color: theme.colors.textMuted }}>Prescribed by {dose.prescriber}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Interactive Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isTaken ? (
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: theme.colors.teal800,
                          backgroundColor: theme.colors.teal100,
                          padding: '3px 10px',
                          borderRadius: theme.radii.pill,
                        }}
                      >
                        <Check size={13} strokeWidth={3} /> Taken
                      </span>
                      <div style={{ fontSize: '0.68rem', color: theme.colors.textMuted, marginTop: '2px' }}>
                        Logged at {dose.takenTime}
                      </div>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: theme.colors.amber700,
                        backgroundColor: theme.colors.amber100,
                        padding: '3px 10px',
                        borderRadius: theme.radii.pill,
                      }}
                    >
                      Pending Intake
                    </span>
                  )}

                  {/* Verification Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleDose(dose.id)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: theme.radii.pill,
                      border: 'none',
                      backgroundColor: isTaken ? theme.colors.teal500 : '#E2E8F0',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isTaken ? theme.shadows.glowTeal : 'none',
                      transition: theme.transitions.fast,
                    }}
                    title={isTaken ? 'Mark as Not Taken' : 'Confirm Dose Taken'}
                    aria-label={`Toggle intake for ${dose.medication}`}
                  >
                    <Check size={20} strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoutinePage;
