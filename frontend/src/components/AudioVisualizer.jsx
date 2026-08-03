import React from 'react';

export const AudioVisualizer = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px' }}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: '100%',
            backgroundColor: 'var(--danger)',
            borderRadius: '2px',
            animation: `soundWave 1.2s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes soundWave {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;
