const WEAK_JWT_SECRETS = [
  'helio-super-secret',
  'secret',
  'jwt-secret',
  'change-me',
  'REPLACE_WITH_STRONG_RANDOM_256BIT_SECRET'
];

// Feature flags with their environment variable names and defaults
const FEATURE_FLAGS = {
  ENABLE_WHATSAPP:  { key: 'ENABLE_WHATSAPP',  default: 'false' },
  ENABLE_OCR:       { key: 'ENABLE_OCR',        default: 'true'  },
  ENABLE_VOICE:     { key: 'ENABLE_VOICE',      default: 'true'  },
  ENABLE_GEMINI:    { key: 'ENABLE_GEMINI',     default: 'true'  },
  ENABLE_EMAIL:     { key: 'ENABLE_EMAIL',      default: 'false' },
  ENABLE_ANALYTICS: { key: 'ENABLE_ANALYTICS',  default: 'true'  },
};

function validateEnv() {
  // Bypass validation in test mode so local offline integration tests can execute
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // ── Required core variables ──────────────────────────────────────────────────
  const required = ['MONGO_URI', 'GEMINI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('❌ CRITICAL STARTUP FAILURE: MISSING CONFIGURATION');
    console.error('======================================================');
    console.error('The following environment variables must be defined:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('======================================================\n');
    process.exit(1);
  }

  // ── CLIENT_URL required for CORS and redirect safety ─────────────────────────
  if (!process.env.CLIENT_URL) {
    console.warn('⚠️ [Config] CLIENT_URL is not set. CORS will default to http://localhost:5173.');
  }

  // ── BACKEND_URL required for OAuth callback in containerised environments ─────
  if (!process.env.BACKEND_URL) {
    console.warn('⚠️ [Config] BACKEND_URL is not set. Google OAuth callback will default to http://localhost:5000.');
  }

  // ── WhatsApp credential check (only when WhatsApp is enabled) ─────────────────
  const whatsappEnabled = (process.env.ENABLE_WHATSAPP || 'false').toLowerCase() === 'true';
  if (whatsappEnabled) {
    const whatsappRequired = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'];
    const missingWhatsapp = whatsappRequired.filter(key => !process.env[key]);
    if (missingWhatsapp.length > 0) {
      console.error('\n======================================================');
      console.error('❌ WHATSAPP is enabled but credentials are missing:');
      missingWhatsapp.forEach(key => console.error(`  - ${key}`));
      console.error('  Set ENABLE_WHATSAPP=false to disable WhatsApp or provide credentials.');
      console.error('======================================================\n');
      process.exit(1);
    }
  }

  // ── JWT strength check ────────────────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!jwtSecret || WEAK_JWT_SECRETS.includes(jwtSecret) || jwtSecret.length < 32)) {
    console.error('\n======================================================');
    console.error('❌ CRITICAL: INSECURE JWT_SECRET DETECTED');
    console.error('======================================================');
    console.error('JWT_SECRET must be a cryptographically strong random value');
    console.error('of at least 32 characters in production environments.');
    console.error('Generate one with:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('======================================================\n');
    process.exit(1);
  }

  if (!jwtSecret) {
    console.warn('⚠️ [Config] JWT_SECRET is not set. Using insecure default. Set a strong secret in production.');
  }

  // ── Log active feature flags ──────────────────────────────────────────────────
  const activeFlags = Object.entries(FEATURE_FLAGS).map(([name, cfg]) => {
    const val = (process.env[cfg.key] || cfg.default).toLowerCase() === 'true';
    return `  ${val ? '✅' : '⬜'} ${name}`;
  });
  console.log('[Config] Feature Flags:\n' + activeFlags.join('\n'));
}

/**
 * Returns true if a feature flag is enabled.
 */
function isFeatureEnabled(flagName) {
  const cfg = FEATURE_FLAGS[flagName];
  if (!cfg) return false;
  return (process.env[cfg.key] || cfg.default).toLowerCase() === 'true';
}

module.exports = { validateEnv, isFeatureEnabled };
