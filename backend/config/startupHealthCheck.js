const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiService = require('../services/geminiService');

async function verifyStartupHealth() {
  console.log('[Health] Verifying startup services readiness...');

  // 1. Verify MongoDB connection readiness
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not fully established.');
  }
  console.log('[Health] MongoDB connection status verified.');

  // 2. Verify Gemini API Readiness via a validation query
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Attempt validation content call
    await model.generateContent('ping');
    console.log('[Health] Gemini API key and connection verified.');
  } catch (err) {
    console.warn(`\n⚠️ [Health] Gemini API verification failed: ${err.message}`);
    console.warn('[Health] Falling back to offline/mock simulation mode for AI services.\n');
    geminiService.disableGenAI();
  }
}

module.exports = { verifyStartupHealth };
