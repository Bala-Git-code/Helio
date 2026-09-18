import React from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Doctor Clinical Safety & Toxicity Alerts Page (/doctor/alerts - Dark)
 * ============================================================================
 */
export function DoctorAlertsPage() {
  const alerts = [
    {
      id: 'ALT-902',
      patient: 'Marcus Vance, 68M',
      riskLevel: 'CRITICAL',
      color: '#FB7185',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      interaction: 'Warfarin 5mg + Clopidogrel 75mg',
      pathway: 'Dual Antiplatelet / Anticoagulant Hemorrhage Risk',
      status: 'Action Required',
      time: '12m ago',
    },
    {
      id: 'ALT-884',
      patient: 'Elena Rostova, 54F',
      riskLevel: 'MODERATE',
      color: '#FBBF24',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
      interaction: 'Atorvastatin 20mg + Dietary Grapefruit Ingestion',
      pathway: 'CYP3A4 Inhibition — Substantial Rhabdomyolysis Risk',
      status: 'Advisory Dispatched',
      time: '45m ago',
    },
    {
      id: 'ALT-771',
      patient: 'David Chen, 61M',
      riskLevel: 'SEVERE',
      color: '#FB7185',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      interaction: 'Lisinopril 20mg + Spironolactone 25mg',
      pathway: 'Synergistic Hyperkalemia — Serum K+ Spike Risk',
      status: 'Lab Panel Ordered',
      time: '2h ago',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: theme.fonts.body }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(13, 14, 26, 0.8) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '24px',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FB7185', marginBottom: '6px' }}>
            <ShieldAlert size={24} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Real-Time Pharmacological Interceptor
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: theme.fonts.heading }}>
            Cohort Drug Safety & Toxicity Alerts
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Multi-drug pharmacokinetic conflict detections requiring physician review or prescription overrides.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 20px',
              borderRadius: '16px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FB7185' }}>2</div>
            <div style={{ fontSize: '0.72rem', color: theme.colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Critical Triage</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 20px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24' }}>1</div>
            <div style={{ fontSize: '0.72rem', color: theme.colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Moderate Watch</div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              background: theme.colors.surfaceCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: theme.shadows.card,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: alert.bg,
                  border: `1px solid ${alert.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: alert.color,
                }}
              >
                {alert.riskLevel === 'CRITICAL' ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>{alert.patient}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: alert.bg,
                      color: alert.color,
                      border: `1px solid ${alert.border}`,
                    }}
                  >
                    {alert.riskLevel}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: theme.colors.textMuted }}>{alert.id} · {alert.time}</span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>
                  {alert.interaction}
                </div>
                <div style={{ fontSize: '0.82rem', color: theme.colors.textMuted }}>{alert.pathway}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: alert.status.includes('Required') ? '#FB7185' : '#34D399',
                }}
              >
                {alert.status}
              </span>
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme.colors.borderLight}`,
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = theme.colors.borderLight;
                }}
              >
                <span>Review & Intercept</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorAlertsPage;
