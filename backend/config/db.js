const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/helio';

  if (!primaryUri) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  const options = {
    connectTimeoutMS: 10000,       // 10s connection timeout
    serverSelectionTimeoutMS: 5000, // 5s server selection timeout
    family: 4                       // Force IPv4 to prevent DNS lookup delay
  };

  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      console.log(`[DB] Connecting to primary MongoDB (Attempt ${attempt}/${maxRetries})...`);
      await mongoose.connect(primaryUri, options);
      console.log('[DB] MongoDB connected successfully to primary URI.');
      return;
    } catch (err) {
      console.warn(`[DB] Primary MongoDB connection attempt ${attempt} failed: ${err.message}`);
      attempt++;
      if (attempt <= maxRetries) {
        console.log('[DB] Waiting 2 seconds before retrying...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.warn('[DB] Primary MongoDB URI connection failed after retries. Trying local fallback...');
  try {
    await mongoose.connect(fallbackUri, options);
    console.log('[DB] MongoDB connected successfully to local fallback.');
  } catch (fallbackErr) {
    console.error('❌ [DB] CRITICAL: All MongoDB connection attempts failed.');
    console.error(`[DB] Fallback error details: ${fallbackErr.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;