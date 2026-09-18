/**
 * ============================================================================
 * HELIO DESIGN SYSTEM THEME TOKENS (UNIFIED COSMIC DARK THEME)
 * "Hyper-Vitality Specular Void & Bioluminescent Glass"
 * ============================================================================
 */

export const theme = {
  colors: {
    // Cosmic Dark Canvas & Surfaces
    canvasVoid: '#08080F',
    canvasAbyss: '#0D0E1A',
    canvasCard: 'rgba(255, 255, 255, 0.04)',
    canvasCardHover: 'rgba(255, 255, 255, 0.07)',
    canvasCardSolid: '#121324',
    
    // Dark Surfaces & Borders
    surfaceGround: '#08080F',
    surfaceGroundWarm: '#0D0E1A',
    surfaceCard: 'rgba(255, 255, 255, 0.04)',
    surfaceCardHover: 'rgba(255, 255, 255, 0.07)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',

    // Sidebar & Navigation
    sidebarBg: '#0A0B14',
    sidebarText: '#A1A1C0',
    sidebarTextActive: '#FFFFFF',
    sidebarBorder: 'rgba(255, 255, 255, 0.08)',
    sidebarSurface: 'rgba(255, 255, 255, 0.04)',
    sidebarActiveBg: 'rgba(139, 92, 246, 0.2)',
    indigo600: '#6D28D9',

    // Vibrant Bioluminescent Accents
    vitalityMint: '#10B981',
    vitalityMintLight: '#34D399',
    vitalityMintSurface: 'rgba(16, 185, 129, 0.12)',
    neuralViolet: '#8B5CF6',
    neuralIndigo: '#4F46E5',
    neuralAmethyst: '#7C3AED',
    neuralSurface: 'rgba(139, 92, 246, 0.12)',
    solarCoral: '#F43F5E',
    solarPlasma: '#FB7185',
    solarAmber: '#F59E0B',
    solarSurface: 'rgba(244, 63, 94, 0.12)',
    cryoCyan: '#06B6D4',
    cryoTeal: '#0D9488',
    cryoSurface: 'rgba(6, 182, 212, 0.12)',
    luminousGold: '#F59E0B',

    // Tailwind Shorthand Compatibility (Dark Translucent Surfaces)
    teal50: 'rgba(16, 185, 129, 0.12)',
    teal100: 'rgba(16, 185, 129, 0.2)',
    teal400: '#34D399',
    teal500: '#10B981',
    teal600: '#10B981',
    teal700: '#34D399',
    teal800: '#6EE7B7',
    indigo50: 'rgba(139, 92, 246, 0.12)',
    indigo100: 'rgba(139, 92, 246, 0.2)',
    indigo500: '#8B5CF6',
    indigo600: '#7C3AED',
    amber50: 'rgba(245, 158, 11, 0.12)',
    amber100: 'rgba(245, 158, 11, 0.2)',
    amber500: '#F59E0B',
    amber700: '#FBBF24',
    amethyst50: 'rgba(139, 92, 246, 0.12)',
    amethyst500: '#8B5CF6',
    amethyst600: '#7C3AED',
    amethyst700: '#6D28D9',
    coral100: 'rgba(244, 63, 94, 0.15)',
    coral500: '#F43F5E',
    coral700: '#FB7185',

    // Typographic Neutrals (High-Contrast Dark Theme)
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1C0',
    textMuted: '#64647A',
    textLightPure: '#FFFFFF',
    textLightSubtle: '#A1A1C0',
    textLightMuted: '#64647A',
  },

  gradients: {
    aurora: 'linear-gradient(135deg, #8B5CF6 0%, #4F46E5 50%, #06B6D4 100%)',
    fintechGlow: 'linear-gradient(135deg, #06B6D4 0%, #4F46E5 50%, #8B5CF6 100%)',
    sunsetPlasma: 'linear-gradient(135deg, #F43F5E 0%, #EA580C 50%, #F59E0B 100%)',
    vitality: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #06B6D4 100%)',
    meshDark: `radial-gradient(at 10% 20%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
               radial-gradient(at 90% 10%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
               radial-gradient(at 50% 90%, rgba(16, 185, 129, 0.10) 0px, transparent 50%),
               #08080F`,
    glassBorder: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.04) 100%)',
  },

  fonts: {
    heading: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  shadows: {
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
    bento: '0 4px 24px rgba(0, 0, 0, 0.35)',
    bentoElevated: '0 20px 50px -12px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
    glowMint: '0 0 30px -5px rgba(16, 185, 129, 0.35)',
    glowViolet: '0 0 35px -5px rgba(139, 92, 246, 0.4)',
    glowCyan: '0 0 30px -5px rgba(6, 182, 212, 0.35)',
    glowCoral: '0 0 30px -5px rgba(244, 63, 94, 0.35)',
  },

  radii: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    pill: '9999px',
  },

  transitions: {
    fast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export default theme;
