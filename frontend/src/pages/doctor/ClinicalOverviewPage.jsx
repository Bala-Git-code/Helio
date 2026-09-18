import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Search,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  ShieldAlert,
  Zap,
  Filter,
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Clinician Station: ClinicalOverviewPage (Unified Cosmic Dark Theme)
 * ============================================================================
 * 
 * High-velocity clinical overview with live cohort telemetry, stratified risk queue,
 * and instant triage actions with dark specular glass cards and high-contrast clinical indicators.
 */
export function ClinicalOverviewPage() {
  const navigate = useNavigate();

  const [flaggedPatients, setFlaggedPatients] = useState([
    {
      id: 'p1',
      name: 'Elena Rostova',
      mrn: 'MRN-8820',
      condition: 'Type 2 Diabetes / HTN',
      adherence: 94,
      alert: 'Dietary Statin Interaction: Grapefruit ingestion recorded',
      severity: 'moderate',
      severityColor: '#F59E0B',
      lastDose: '08:14 AM Today',
      avatar: 'ER',
      action: 'Review Dietary Advisory',
    },
    {
      id: 'p2',
      name: 'Marcus Vance',
      mrn: 'MRN-4412',
      condition: 'Atrial Fibrillation / Post-PCI',
      adherence: 48,
      alert: 'Critical Pharmacokinetic Conflict: Warfarin + Clopidogrel',
      severity: 'critical',
      severityColor: '#F43F5E',
      lastDose: '36 hours ago',
      avatar: 'MV',
      action: 'Immediate MD Triage',
    },
    {
      id: 'p3',
      name: 'David Chen',
      mrn: 'MRN-9014',
      condition: 'Heart Failure (HFrEF) / CKD',
      adherence: 64,
      alert: 'Hyperkalemia Risk: Lisinopril + Spironolactone synergistic spike',
      severity: 'high',
      severityColor: '#F43F5E',
      lastDose: 'Yesterday 08:00 PM',
      avatar: 'DC',
      action: 'Order Serum K+ Lab',
    },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      {/* Top Command Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(13, 14, 26, 0.8) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '24px',
          padding: '24px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                letterSpacing: '0.08em',
              }}
            >
              Cardiology & Pharmacotherapy
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Master Physician Console</span>
          </div>
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Clinical Operations & Population Triage
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/doctor/alerts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#FB7185',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <ShieldAlert size={16} />
            <span>Safety Radar (2 Active)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor/prescriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
            }}
          >
            <FileText size={16} />
            <span>Author Prescription Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        {[
          { label: 'Active Monitored Cohort', val: '148', change: '+6 enrolled this week', icon: Users, color: '#60A5FA', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' },
          { label: 'Cohort Mean Adherence', val: '89.2%', change: '+3.4% above hospital avg', icon: TrendingUp, color: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
          { label: 'High-Risk Triage Queue', val: '3 Cases', change: 'Immediate physician review', icon: AlertOctagon, color: '#FB7185', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' },
          { label: 'Pending Digital Rx Orders', val: '6 Orders', change: 'Awaiting MD digital sign', icon: FileText, color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              style={{
                background: theme.colors.surfaceCard,
                borderRadius: '20px',
                border: `1px solid ${theme.colors.borderLight}`,
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: theme.shadows.card,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: kpi.bg,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${kpi.border}`,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontFamily: theme.fonts.heading, fontSize: '2rem', fontWeight: 800, marginTop: '14px', color: '#FFFFFF' }}>
                {kpi.val}
              </div>
              <div style={{ fontSize: '0.75rem', color: kpi.color, fontWeight: 600, marginTop: '4px' }}>
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Actionable Triage Queue */}
      <div
        style={{
          background: theme.colors.surfaceCard,
          borderRadius: '24px',
          border: `1px solid ${theme.colors.borderLight}`,
          padding: '28px',
          boxShadow: theme.shadows.card,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: theme.fonts.heading, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Actionable Patient Risk Queue
            </h2>
            <p style={{ fontSize: '0.8rem', color: theme.colors.textMuted, margin: '3px 0 0 0' }}>
              Real-time stratified priority feed identifying patients exhibiting critical non-adherence or active pharmacological toxicity.
            </p>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              color: '#FB7185',
              fontWeight: 800,
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              padding: '4px 12px',
              borderRadius: '9999px',
            }}
          >
            3 Priority Flags
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {flaggedPatients.map((p) => {
            const isCritical = p.severity === 'critical';

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 22px',
                  borderRadius: '16px',
                  border: isCritical ? '1px solid rgba(244, 63, 94, 0.35)' : `1px solid ${theme.colors.borderLight}`,
                  backgroundColor: isCritical ? 'rgba(244, 63, 94, 0.10)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${p.severityColor}25`,
                      color: p.severityColor,
                      border: `1px solid ${p.severityColor}60`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.94rem',
                    }}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{p.name}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#60A5FA',
                          background: 'rgba(37, 99, 235, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          fontFamily: theme.fonts.mono,
                          fontWeight: 700,
                        }}
                      >
                        {p.mrn}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: theme.colors.textMuted }}>• {p.condition}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: p.severityColor, fontWeight: 600, marginTop: '4px' }}>
                      ⚠️ {p.alert}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: p.adherence < 60 ? '#FB7185' : p.adherence < 80 ? '#FBBF24' : '#34D399' }}>
                      {p.adherence}% Adherence
                    </div>
                    <div style={{ fontSize: '0.7rem', color: theme.colors.textMuted }}>
                      Last intake: {p.lastDose}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/doctor/patients')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: '12px',
                      padding: '9px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
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
                    <span>{p.action}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ClinicalOverviewPage;
