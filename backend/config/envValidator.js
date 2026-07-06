const WEAK_JWT_SECRETS = [
  'helio-super-secret',
  'secret',
  'jwt-secret',
  'change-me',
  'REPLACE_WITH_STRONG_RANDOM_256BIT_SECRET'
];

function validateEnv() {
  // Bypass validation in test mode so local offline integration tests can execute
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const required = ['MONGO_URI', 'GEMINI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('❌ CRITICAL STARTUP FAILURE: MISSING CONFIGURATION');
    console.error('======================================================');
    console.error(`The following environment variables must be defined:`);
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('======================================================\n');
    process.exit(1);
  }

  // Warn about weak JWT secrets in production
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
}

module.exports = { validateEnv };
