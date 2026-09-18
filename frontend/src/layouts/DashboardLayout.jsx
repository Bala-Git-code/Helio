import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { AiAssistantDrawer } from '../components/ai/AiAssistantDrawer';
import { theme } from '../theme/theme';

/**
 * ============================================================================
 * HELIO Enterprise Dashboard Layout (Pure React Modular)
 * ============================================================================
 */
export const DashboardLayout = ({
  children,
  currentPortal = 'patient',
  onPortalSwitch,
  currentRoute = 'routine',
  onRouteChange,
  title = "Today's Routine",
  adherencePercentage = 75,
}) => {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: theme.colors.surfaceGround,
        fontFamily: theme.fonts.body,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* 1. Modular Persistent Sidebar */}
      <Sidebar
        currentPortal={currentPortal}
        onPortalSwitch={onPortalSwitch}
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        adherencePercentage={adherencePercentage}
      />

      {/* 2. Main Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: theme.colors.surfaceGround,
        }}
      >
        <TopHeader
          currentPortal={currentPortal}
          currentTitle={title}
          alertCount={1}
        />

        {/* 3. Main Dynamic Content Canvas */}
        <main
          style={{
            flex: 1,
            padding: '32px 36px 64px 36px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
          role="main"
        >
          {children}
        </main>
      </div>

      {/* 4. Floating Gemini AI Assistant Button */}
      <button
        type="button"
        onClick={() => setIsAiOpen(true)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '32px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px 12px 16px',
          background: `linear-gradient(135deg, ${theme.colors.indigo600} 0%, ${theme.colors.amethyst700} 100%)`,
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: theme.radii.pill,
          boxShadow: `${theme.shadows.glowAi}, ${theme.shadows.elevated}`,
          cursor: 'pointer',
          fontFamily: theme.fonts.body,
          fontSize: '0.88rem',
          fontWeight: 600,
          transition: theme.transitions.spring,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
        }}
        aria-label="Ask Helio AI Health Assistant"
      >
        <Sparkles size={18} />
        <span>Ask Helio AI</span>
      </button>

      {/* 5. Gemini AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
