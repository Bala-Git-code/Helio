const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/helio';

  try {
    console.log('Connecting to primary MongoDB URI...');
    await mongoose.connect(primaryUri);
    console.log('MongoDB Connected successfully to primary URI!');
  } catch (err) {
    console.warn(`Primary MongoDB Connection failed: ${err.message}. Trying local fallback...`);
    try {
      await mongoose.connect(fallbackUri);
      console.log('MongoDB Connected successfully to local fallback!');
    } catch (fallbackErr) {
      console.error('All MongoDB connection attempts failed.');
      console.error(`Fallback error: ${fallbackErr.message}`);
      console.warn('WARNING: Running server in database-disconnected mode. Persistent operations may fail, but server remains active.');
    }
  }
};

module.exports = connectDB;