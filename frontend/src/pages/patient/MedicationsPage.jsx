import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert
} from 'lucide-react';
import { theme } from '../../theme/theme';

/**
 * ============================================================================
 * HELIO Patient Medications Cabinet Page (Pure React Styled)
 * ============================================================================
 */
export const MedicationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const medications = [
    {
      id: 'm1',
      name: 'Metformin Hydrochloride',
      brand: 'Glucophage XR',
      strength: '500 mg',
      form: 'Oral Extended-Release Tablet',
      ndc: '0087-6060-05',
      rxNorm: '860975',
      indication: 'Type 2 Diabetes Mellitus',
      instructions: 'Take 1 tablet daily with dinner. Do not crush.',
      foodInstruction: 'Take with food',
      schedule: ['08:00 PM'],
      prescriber: 'Dr. Sarah Jenkins (Endocrinology)',
      refillsLeft: 3,
      daysRemaining: 24,
      status: 'active',
      sideEffects: ['Mild nausea', 'Digestive upset'],
      blackBoxWarning: 'Lactic acidosis risk with acute renal impairment.',
    },
    {
      id: 'm2',
      name: 'Lisinopril',
      brand: 'Prinivil',
      strength: '10 mg',
      form: 'Oral Tablet',
      ndc: '0006-0207-68',
      rxNorm: '314076',
      indication: 'Essential Hypertension',
      instructions: 'Take 1 tablet every morning with water.',
      foodInstruction: 'May take with or without food',
      schedule: ['08:00 AM'],
      prescriber: 'Dr. Aris Thorne (Cardiology)',
      refillsLeft: 1,
      daysRemaining: 4,
      status: 'refill_needed',
      sideEffects: ['Dry cough', 'Dizziness', 'Headache'],
      blackBoxWarning: 'Fetal toxicity risk if pregnant.',
    },
    {
      id: 'm3',
      name: 'Atorvastatin Calcium',
      brand: 'Lipitor',
      strength: '20 mg',
      form: 'Oral Tablet',
      ndc: '0071-0156-23',
      rxNorm: '259255',
      indication: 'Hypercholesterolemia & CVD Prevention',
      instructions: 'Take 1 tablet at bedtime. Strictly avoid whole grapefruit.',
      foodInstruction: 'Avoid grapefruit & grapefruit juice',
      schedule: ['09:00 PM'],
      prescriber: 'Dr. Aris Thorne (Cardiology)',
      refillsLeft: 5,
      daysRemaining: 42,
      status: 'active',
      sideEffects: ['Muscle stiffness', 'Mild joint pain'],
      blackBoxWarning: null,
    },
    {
      id: 'm4',
      name: 'Omega-3 Acid Ethyl Esters',
      brand: 'Lovaza',
      strength: '1,000 mg',
      form: 'Liquid-Filled Capsule',
      ndc: '0173-0783-02',
      rxNorm: '646452',
      indication: 'Hypertriglyceridemia',
      instructions: 'Take 1 capsule with midday lunch.',
      foodInstruction: 'Take with fatty meal for absorption',
      schedule: ['01:00 PM'],
      prescriber: 'Dr. Aris Thorne (Cardiology)',
      refillsLeft: 2,
      daysRemaining: 18,
      status: 'active',
      sideEffects: ['Burping', 'Taste change'],
      blackBoxWarning: null,
    },
  ];

  const filtered = medications.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.indication.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'refill') return matchesSearch && m.status === 'refill_needed';
    return matchesSearch && m.status === filterType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', fontFamily: theme.fonts.body }}>
      {/* Header Banner & Quick Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontFamily: theme.fonts.heading, fontSize: '1.75rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
            Medication Cabinet
          </h1>
          <p style={{ fontSize: '0.84rem', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
            Comprehensive directory of your verified clinical prescriptions, schedules, and refill statuses.
          </p>
        </div>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: theme.colors.indigo600,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: theme.radii.pill,
            padding: '10px 20px',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: theme.shadows.glowIndigo,
            transition: theme.transitions.fast,
          }}
        >
          <Plus size={16} />
          <span>Request New Rx / Refill</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: theme.colors.surfaceCard,
          padding: '12px 18px',
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          boxShadow: theme.shadows.subtle,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '380px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.textMuted,
            }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by drug name, brand, or condition..."
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: theme.radii.pill,
              border: `1px solid ${theme.colors.borderLight}`,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: theme.fonts.body,
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Medications' },
            { id: 'active', label: 'Active Regimen' },
            { id: 'refill', label: 'Refill Due (1)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              style={{
                background: filterType === tab.id ? theme.colors.indigo600 : theme.colors.surfaceGround,
                color: filterType === tab.id ? '#FFFFFF' : theme.colors.textSecondary,
                border: `1px solid ${filterType === tab.id ? theme.colors.indigo600 : theme.colors.borderLight}`,
                borderRadius: theme.radii.pill,
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medication Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '20px' }}>
        {filtered.map((med) => {
          const isRefillUrgent = med.status === 'refill_needed';

          return (
            <div
              key={med.id}
              style={{
                background: theme.colors.surfaceCard,
                borderRadius: theme.radii.xl,
                border: isRefillUrgent
                  ? `1px solid rgba(244, 63, 94, 0.35)`
                  : `1px solid ${theme.colors.borderLight}`,
                padding: '24px',
                boxShadow: theme.shadows.card,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontFamily: theme.fonts.heading, fontSize: '1.18rem', fontWeight: 700, margin: 0, color: theme.colors.textPrimary }}>
                        {med.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: theme.colors.indigo50,
                          color: theme.colors.indigo600,
                          padding: '2px 8px',
                          borderRadius: theme.radii.pill,
                        }}
                      >
                        {med.strength}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: '2px' }}>
                      Brand: <strong>{med.brand}</strong> • {med.indication}
                    </div>
                  </div>

                  {isRefillUrgent ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: theme.colors.coral100,
                        color: theme.colors.coral700,
                        padding: '3px 10px',
                        borderRadius: theme.radii.pill,
                      }}
                    >
                      Refill Due: {med.daysRemaining}d left
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: theme.colors.teal100,
                        color: theme.colors.teal800,
                        padding: '3px 10px',
                        borderRadius: theme.radii.pill,
                      }}
                    >
                      Active ({med.daysRemaining}d supply)
                    </span>
                  )}
                </div>

                {/* Instructions Box */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.surfaceGround,
                    border: `1px solid ${theme.colors.borderLight}`,
                    fontSize: '0.78rem',
                    color: theme.colors.textSecondary,
                  }}
                >
                  <div style={{ fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '2px' }}>
                    Dosing Directions:
                  </div>
                  <div>{med.instructions}</div>
                </div>

                {/* Food Caution Pill */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: theme.radii.pill,
                      backgroundColor: theme.colors.amber50,
                      color: theme.colors.amber700,
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    🍴 {med.foodInstruction}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: theme.radii.pill,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.borderLight}`,
                    }}
                  >
                    ⏰ {med.schedule.join(', ')}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  borderTop: `1px solid ${theme.colors.borderLight}`,
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: theme.colors.textMuted }}>
                  Prescriber: <strong>{med.prescriber}</strong>
                </div>

                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: theme.radii.pill,
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: theme.colors.indigo600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Rx Details</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationsPage;
