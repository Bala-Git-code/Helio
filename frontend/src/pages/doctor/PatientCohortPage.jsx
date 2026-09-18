import React, { useState } from 'react';
import {
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  Filter,
  MoreVertical,
  Plus,
  Search,
  User,
  Users,
  X,
  FileText,
  Activity,
  AlertTriangle,
  Pill,
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Doctor Station: PatientCohortPage (Unified Cosmic Dark Theme)
 * ============================================================================
 */
export function PatientCohortPage() {
  const [search, setSearch] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [activeChartPatient, setActiveChartPatient] = useState(null);

  const cohort = [
    {
      id: 'p1',
      name: 'Elena Rostova',
      mrn: 'MRN-8820',
      age: 54,
      gender: 'Female',
      condition: 'Type 2 Diabetes, HTN',
      adherence: 94,
      activeDrugs: 4,
      risk: 'Optimal',
      riskColor: '#34D399',
      riskBg: 'rgba(16, 185, 129, 0.15)',
      riskBorder: 'rgba(16, 185, 129, 0.3)',
      medications: ['Metformin HCl 500mg ER', 'Lisinopril 10mg', 'Atorvastatin 20mg', 'Omega-3 1000mg'],
      notes: 'Active dietary watch: Grapefruit juice interaction flagged. Adherence excellent at 94%.',
    },
    {
      id: 'p2',
      name: 'Marcus Vance',
      mrn: 'MRN-4412',
      age: 68,
      gender: 'Male',
      condition: 'Atrial Fibrillation, Post-PCI',
      adherence: 48,
      activeDrugs: 3,
      risk: 'Critical',
      riskColor: '#FB7185',
      riskBg: 'rgba(244, 63, 94, 0.15)',
      riskBorder: 'rgba(244, 63, 94, 0.3)',
      medications: ['Warfarin Sodium 5mg', 'Clopidogrel 75mg', 'Metoprolol Tartrate 50mg'],
      notes: 'Critical dual antiplatelet/anticoagulant conflict. Missed 3 doses in past 48 hours.',
    },
    {
      id: 'p3',
      name: 'David Chen',
      mrn: 'MRN-9014',
      age: 61,
      gender: 'Male',
      condition: 'Heart Failure (HFrEF), CKD',
      adherence: 64,
      activeDrugs: 5,
      risk: 'High Risk',
      riskColor: '#FB7185',
      riskBg: 'rgba(244, 63, 94, 0.15)',
      riskBorder: 'rgba(244, 63, 94, 0.3)',
      medications: ['Lisinopril 20mg', 'Spironolactone 25mg', 'Carvedilol 12.5mg', 'Furosemide 40mg', 'Empagliflozin 10mg'],
      notes: 'Serum potassium elevated at 5.4 mEq/L. Requires urgent lab panel follow-up.',
    },
    {
      id: 'p4',
      name: 'Robert Chen',
      mrn: 'MRN-3120',
      age: 49,
      gender: 'Male',
      condition: 'Dyslipidemia, CAD',
      adherence: 94,
      activeDrugs: 2,
      risk: 'Optimal',
      riskColor: '#34D399',
      riskBg: 'rgba(16, 185, 129, 0.15)',
      riskBorder: 'rgba(16, 185, 129, 0.3)',
      medications: ['Rosuvastatin Calcium 10mg', 'Aspirin 81mg'],
      notes: 'Lipid panel nominal (LDL < 70 mg/dL). No reported adverse side effects.',
    },
    {
      id: 'p5',
      name: 'Diane Washington',
      mrn: 'MRN-7891',
      age: 72,
      gender: 'Female',
      condition: 'Hypertension, Osteoarthritis',
      adherence: 91,
      activeDrugs: 4,
      risk: 'Optimal',
      riskColor: '#34D399',
      riskBg: 'rgba(16, 185, 129, 0.15)',
      riskBorder: 'rgba(16, 185, 129, 0.3)',
      medications: ['Amlodipine 5mg', 'Hydrochlorothiazide 25mg', 'Acetaminophen 650mg ER', 'Calcium + Vit D'],
      notes: 'Blood pressure controlled at 122/78 mmHg. Refills current.',
    },
    {
      id: 'p6',
      name: 'Carlos Mendez',
      mrn: 'MRN-5542',
      age: 58,
      gender: 'Male',
      condition: 'Metabolic Syndrome',
      adherence: 82,
      activeDrugs: 3,
      risk: 'Moderate',
      riskColor: '#FBBF24',
      riskBg: 'rgba(245, 158, 11, 0.15)',
      riskBorder: 'rgba(245, 158, 11, 0.3)',
      medications: ['Metformin 1000mg', 'Atorvastatin 10mg', 'Losartan 50mg'],
      notes: 'Occasional missed weekend doses reported. Patient coached on reminder notifications.',
    },
  ];

  const filtered = cohort.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      selectedRiskFilter === 'all' ||
      (selectedRiskFilter === 'critical' && (p.risk === 'Critical' || p.risk === 'High Risk')) ||
      (selectedRiskFilter === 'moderate' && p.risk === 'Moderate') ||
      (selectedRiskFilter === 'optimal' && p.risk === 'Optimal');

    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: theme.fonts.body }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Patient Cohort Directory
          </h1>
          <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
            Longitudinal population roster with live adherence telemetric tracking and risk stratification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', 'critical', 'moderate', 'optimal'].map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setSelectedRiskFilter(rf)}
              style={{
                textTransform: 'capitalize',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: '10px',
                border: selectedRiskFilter === rf ? '1px solid rgba(139, 92, 246, 0.6)' : `1px solid ${theme.colors.borderLight}`,
                background: selectedRiskFilter === rf ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedRiskFilter === rf ? '#FFFFFF' : theme.colors.textSecondary,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              {rf === 'all' ? 'All Cohorts' : `${rf} Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: theme.colors.surfaceCard,
          borderRadius: '24px',
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadows.card,
          overflow: 'hidden',
        }}
      >
        {/* Table Search Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <div style={{ position: 'relative', width: '360px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.textMuted,
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, MRN, or clinical condition..."
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.borderLight}`,
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                outline: 'none',
                fontFamily: theme.fonts.body,
              }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', color: theme.colors.textMuted, fontWeight: 600 }}>
            Showing {filtered.length} of {cohort.length} Patients
          </span>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>Patient Name</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>MRN</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>Primary Diagnosis</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>Adherence</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>Risk Tier</th>
                <th style={{ padding: '14px 24px', fontWeight: 700, color: theme.colors.textMuted, fontSize: '0.72rem', textTransform: 'uppercase' }}>Active Rx</th>
                <th style={{ padding: '14px 24px', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{p.name}</div>
                    <div style={{ fontSize: '0.74rem', color: theme.colors.textMuted }}>{p.gender} · {p.age} yrs</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontFamily: theme.fonts.mono, color: '#60A5FA', fontSize: '0.78rem', fontWeight: 700 }}>
                    {p.mrn}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#CBD5E1' }}>
                    {p.condition}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 800, color: p.adherence < 60 ? '#FB7185' : p.adherence < 80 ? '#FBBF24' : '#34D399' }}>
                      {p.adherence}%
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: p.riskBg,
                        color: p.riskColor,
                        border: `1px solid ${p.riskBorder}`,
                      }}
                    >
                      {p.risk}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: theme.colors.textMuted, fontWeight: 600 }}>
                    {p.activeDrugs} Medications
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setActiveChartPatient(p)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${theme.colors.borderLight}`,
                        borderRadius: '10px',
                        padding: '6px 14px',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.borderLight;
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      Inspect Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Patient Detail Modal */}
      {activeChartPatient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 8, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={() => setActiveChartPatient(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#0D0E1A',
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              borderRadius: '28px',
              padding: '32px',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Electronic Health Record · {activeChartPatient.mrn}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: theme.fonts.heading }}>
                  {activeChartPatient.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveChartPatient(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <span style={{ background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${theme.colors.borderLight}`, padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                {activeChartPatient.condition}
              </span>
              <span style={{ background: activeChartPatient.riskBg, color: activeChartPatient.riskColor, border: `1px solid ${activeChartPatient.riskBorder}`, padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                {activeChartPatient.risk}
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>
                Active Regimen ({activeChartPatient.medications.length} Prescriptions)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeChartPatient.medications.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${theme.colors.borderLight}`,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#F1F5F9',
                    }}
                  >
                    <Pill size={14} color="#8B5CF6" />
                    <span>{med}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                Clinical Pharmacotherapy Notes
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: `1px solid ${theme.colors.borderLight}`, padding: '12px 14px', borderRadius: '10px', fontSize: '0.84rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                {activeChartPatient.notes}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveChartPatient(null)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
              }}
            >
              Close Patient Inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientCohortPage;
