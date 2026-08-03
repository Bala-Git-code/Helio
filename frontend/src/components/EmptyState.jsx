import React from 'react';
import { Pill, CheckCircle2, FileText, Sparkles } from 'lucide-react';

export const EmptyState = ({ type = 'medications', onAction }) => {
  const configs = {
    medications: {
      icon: <Pill size={40} color="var(--primary)" />,
      title: 'No Active Medications Configured',
      description: 'Add your current prescription schedules or scan a prescription document to enable intelligent adherence tracking.',
      actionText: 'Add First Medication',
    },
    prescriptions: {
      icon: <FileText size={40} color="var(--secondary)" />,
      title: 'No Active Prescriptions Issued',
      description: 'Prescriptions issued by your linked physician will appear here with automated outbox audit history.',
      actionText: 'Request Prescription',
    },
    noMissed: {
      icon: <CheckCircle2 size={40} color="var(--secondary)" />,
      title: 'Zero Missed Doses Recorded!',
      description: 'Excellent clinical compliance! All scheduled medication doses are fully up to date.',
      actionText: null,
    },
  };

  const config = configs[type] || configs.medications;

  return (
    <div style={{
      padding: '2.5rem 1.5rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      border: '1px stroke var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
        {config.icon}
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{config.title}</h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>{config.description}</p>
      {config.actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: '0.5rem' }}>
          <Sparkles size={14} /> {config.actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
