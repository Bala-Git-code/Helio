import React from 'react';

/**
 * ============================================================================
 * HELIO Official Brand Logo Component
 * ============================================================================
 * 
 * Features:
 * - Uses the official user-created HELIO emblem (Rod of Asclepius with entwined ribbon)
 * - Harmonized with the application's existing signature Electric Cyan (#06B6D4) and
 *   Ultraviolet Violet (#8B5CF6) palette
 * - Supports multiple variants:
 *     * 'badge'      : Emblem nestled inside the signature luminous gradient badge box
 *     * 'symbol'     : Transparent emblem alone (colored, white, or original)
 *     * 'horizontal' : Emblem beside the HELIO wordmark and subtitle
 *     * 'full'       : Stacked emblem, wordmark, and subtitle
 */
export function HelioLogo({
  variant = 'badge',
  size = 38,
  colorMode = 'white', // 'white' | 'colored' | 'original'
  showText = false,
  title = 'HELIO',
  subtitle = 'Medication Intelligence',
  badgeGradient,
  badgeRadius = 12,
  badgeShadow,
  style = {},
  className = '',
  onClick,
}) {
  // Select appropriate high-resolution asset
  let src = '/helio-logo-symbol-white.png';
  if (colorMode === 'colored') {
    src = '/helio-logo-symbol-colored.png';
  } else if (colorMode === 'original') {
    src = '/helio-logo-symbol.png';
  }

  // Symbol emblem image
  const emblemImg = (
    <img
      src={src}
      alt="HELIO Logo"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        filter: colorMode === 'white' 
          ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' 
          : 'drop-shadow(0 0 10px rgba(6,182,212,0.45))',
      }}
    />
  );

  // 1. Badge Variant (Emblem inside the signature luminous container)
  if (variant === 'badge') {
    const defaultGradient = 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)';
    const defaultShadow = '0 0 20px rgba(139,92,246,0.45), 0 2px 8px rgba(6,182,212,0.25)';

    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: badgeRadius,
          background: badgeGradient || defaultGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Math.max(4, Math.round(size * 0.14)),
          boxShadow: badgeShadow || defaultShadow,
          flexShrink: 0,
          cursor: onClick ? 'pointer' : 'inherit',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        {emblemImg}
      </div>
    );
  }

  // 2. Symbol-Only Variant (Transparent emblem)
  if (variant === 'symbol') {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          width: size,
          height: Math.round(size * 1.55),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: onClick ? 'pointer' : 'inherit',
          ...style,
        }}
      >
        {emblemImg}
      </div>
    );
  }

  // 3. Horizontal Brand Lockup (Badge / Symbol + Wordmark & Subtitle)
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(8, Math.round(size * 0.28)),
        cursor: onClick ? 'pointer' : 'inherit',
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: badgeRadius,
          background: badgeGradient || 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Math.max(4, Math.round(size * 0.14)),
          boxShadow: badgeShadow || '0 0 20px rgba(139,92,246,0.45)',
          flexShrink: 0,
        }}
      >
        {emblemImg}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: size >= 36 ? '1.38rem' : '1.18rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#FFFFFF',
            lineHeight: 1.1,
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default HelioLogo;
