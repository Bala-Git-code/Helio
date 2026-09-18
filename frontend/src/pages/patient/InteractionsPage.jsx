import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Pill,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Drug Safety & Interaction Radar Page (Pure React Styled)
 * ============================================================================
 */
export const InteractionsPage = () => {
  const interactions = [
    {
      id: 'i1',
      primaryDrug: 'Atorvastatin Calcium (20mg)',
      secondaryAgent: 'Whole Grapefruit / Juice',
      type: 'Drug-Food Interaction',
      severity: 'moderate',
      severityLabel: 'Moderate Risk',
      severityColor: theme.colors.amber500,
      severityBg: theme.colors.amber100,
      mechanism:
        'Intestinal CYP3A4 enzyme inhibition increases systemic bioavailability of Atorvastatin by up to 2.5x, elevating the clinical probability of rhabdomyolysis and myalgia.',
      recommendation: 'Eliminate grapefruit intake. If dietary citrus is desired, switch to oranges or lemons which do not inhibit CYP3A4.',
      status: 'Active Advisory',
    },
    {
      id: 'i2',
      primaryDrug: 'Lisinopril (10mg)',
      secondaryAgent: 'Potassium Supplements / Salt Substitutes',
      type: 'Drug-Nutrient Interaction',
      severity: 'major',
      severityLabel: 'Major Risk',
      severityColor: theme.colors.coral500,
      severityBg: theme.colors.coral100,
      mechanism:
        'ACE inhibitors reduce aldosterone production, which diminishes renal excretion of potassium. Combining with potassium chloride salt substitutes risks acute hyperkalemia.',
      recommendation: 'Periodic serum potassium (K+) monitoring. Use non-potassium herbs and spices for sodium substitution.',
      status: 'Monitored in EHR',
    },
    {
      id: 'i3',
      primaryDrug: 'Metformin Hydrochloride (500mg)',
      secondaryAgent: 'Lisinopril (10mg)',
      type: 'Drug-Drug Synergy',
      severity: 'safe',
      severityLabel: 'Synergistic / Safe',
      severityColor: theme.colors.teal600,
      severityBg: theme.colors.teal100,
      mechanism:
        'Combined ACE inhibitor and Metformin therapy provides complementary cardiovascular and nephroprotective benefits in diabetic hypertensive patients.',
      recommendation: 'Standard co-administration. Monitor estimated Glomerular Filtration Rate (eGFR) annually.',
      status: 'Verified Safe',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldAlert size={22} color={theme.colors.indigo600} />
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
            Drug Safety & Interaction Radar
          </h1>
        </div>
        <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: 0 }}>
          Real-time pharmacological cross-analysis scanning pairwise drug-drug, drug-food, and pharmacokinetic contraindications.
        </p>
      </div>

      {/* Safety Matrix Metric Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Active Regimen Drugs', value: '4', icon: Pill, color: theme.colors.indigo600, bg: theme.colors.indigo50 },
          { label: 'Pairwise Cross-Checks', value: '6 Pairs', icon: Zap, color: theme.colors.teal600, bg: theme.colors.teal50 },
          { label: 'Moderate Alerts', value: '1 Advisory', icon: AlertTriangle, color: theme.colors.amber500, bg: theme.colors.amber50 },
          { label: 'Contraindicated', value: '0 Critical', icon: ShieldCheck, color: theme.colors.teal600, bg: theme.colors.teal50 },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              style={{
                background: theme.colors.surfaceCard,
                borderRadius: theme.radii.lg,
                border: `1px solid ${theme.colors.borderLight}`,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: theme.shadows.subtle,
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', color: theme.colors.textMuted, fontWeight: 600 }}>{card.label}</div>
                <div style={{ fontFamily: theme.fonts.heading, fontSize: '1.35rem', fontWeight: 700, marginTop: '2px', color: theme.colors.textPrimary }}>
                  {card.value}
                </div>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interaction Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {interactions.map((item) => (
          <div
            key={item.id}
            style={{
              background: theme.colors.surfaceCard,
              borderRadius: theme.radii.xl,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: '24px',
              boxShadow: theme.shadows.card,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.colors.textPrimary }}>
                    {item.primaryDrug}
                  </span>
                  <span style={{ color: theme.colors.textMuted, fontWeight: 700 }}>⟷</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: theme.colors.textPrimary }}>
                    {item.secondaryAgent}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: theme.colors.textMuted, marginTop: '3px' }}>
                  Classification: <strong>{item.type}</strong>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: item.severityBg,
                  color: item.severityColor,
                  padding: '4px 12px',
                  borderRadius: theme.radii.pill,
                }}
              >
                {item.severityLabel}
              </span>
            </div>

            {/* Pharmacological Mechanism */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceGround,
                borderRadius: theme.radii.md,
                padding: '14px',
                border: `1px solid ${theme.colors.borderLight}`,
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: theme.colors.textSecondary,
              }}
            >
              <div style={{ fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '2px' }}>
                Biological Mechanism:
              </div>
              <div>{item.mechanism}</div>
            </div>

            {/* Recommendation */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: theme.colors.textPrimary }}>
              <Info size={16} color={theme.colors.indigo600} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Clinical Action:</strong> {item.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InteractionsPage;
