const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiService = require('../services/geminiService');

async function verifyStartupHealth() {
  console.log('[Health] Verifying startup services readiness...');

  // ── 1. MongoDB readiness ──────────────────────────────────────────────────────
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not fully established.');
  }
  console.log('[Health] ✅ MongoDB connection status verified.');

  // ── 2. Redis readiness (optional — only when REDIS_URL is provided) ───────────
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // Dynamic import — Redis client is optional; will only be required if configured.
      const { createClient } = require('redis');
      const redisClient = createClient({ url: redisUrl, socket: { connectTimeout: 5000 } });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.quit();
      console.log('[Health] ✅ Redis connection verified.');
    } catch (err) {
      // Redis is optional — warn but do not crash the platform
      console.warn(`⚠️ [Health] Redis ping failed: ${err.message}`);
      console.warn('[Health] Redis is not available. Session caching will use in-memory fallback.');
    }
  } else {
    console.log('[Health] ℹ️  Redis not configured (REDIS_URL not set). Skipping Redis check.');
  }

  // ── 3. Gemini API readiness ───────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('ping');
    console.log('[Health] ✅ Gemini API key and connection verified.');
  } catch (err) {
    console.warn(`\n⚠️ [Health] Gemini API verification failed: ${err.message}`);
    console.warn('[Health] Falling back to offline/mock simulation mode for AI services.\n');
    geminiService.disableGenAI();
  }

  console.log('[Health] Startup readiness check complete.');
}

module.exports = { verifyStartupHealth };
