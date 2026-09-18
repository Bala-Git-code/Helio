import mongoose from 'mongoose';

/**
 * ============================================================================
 * HELIO Medication Intelligence Platform
 * Database Connection Management Module (MongoDB / Mongoose)
 * ============================================================================
 * 
 * Business & Architectural Rationale:
 * In a mission-critical clinical platform like HELIO, patient medication
 * schedules, drug interaction alerts, and adherence records require high
 * availability, resilient connection pooling, and transparent connection state
 * telemetry.
 * 
 * Key Features:
 * - Robust error handling with automatic reconnect handling.
 * - Connection lifecycle listeners for DevOps/Observability metrics.
 * - Graceful connection closure on process termination (SIGINT, SIGTERM)
 *   to prevent socket hanging and partial transactional commits.
 */

// Track database connection state for health check endpoints
let isConnected = false;

/**
 * Establishes a persistent connection to the MongoDB cluster.
 * 
 * @returns {Promise<typeof mongoose>} Resolves to Mongoose instance upon connection.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helio_db';

  // Safeguard against duplicate connection requests
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('[HELIO DB] Existing MongoDB connection reused.');
    return mongoose;
  }

  const options = {
    // Maximum number of concurrent connections in the pool for clinical concurrency
    maxPoolSize: 20,
    // How long to wait before timing out connection establishment (10s)
    serverSelectionTimeoutMS: 10000,
    // Close sockets after 45s of inactivity
    socketTimeoutMS: 45000,
    // Enable automated background index creation in non-production environments
    autoIndex: process.env.NODE_ENV !== 'production',
  };

  try {
    console.log('[HELIO DB] Attempting connection to MongoDB cluster...');
    const conn = await mongoose.connect(uri, options);
    isConnected = true;

    console.log(`[HELIO DB] MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Register active event listeners for continuous runtime monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`[HELIO DB ERROR] MongoDB connection failure: ${err.message}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[HELIO DB WARN] MongoDB connection disconnected. Awaiting reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[HELIO DB INFO] MongoDB reconnected successfully.');
      isConnected = true;
    });

    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[HELIO DB FATAL] Failed to establish initial connection to MongoDB: ${error.message}`);
    
    // In production healthcare platforms, a failed DB connection should trigger alerts
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[HELIO DB WARN] Running in non-production mode. Server will remain active for route inspection.');
    }
  }
};

/**
 * Returns current health and diagnostic metrics of the database connection.
 * Used by /health and monitoring services.
 */
export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };

  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    isConnected,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null
  };
};

/**
 * Gracefully terminates the MongoDB connection pool.
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    isConnected = false;
    console.log('[HELIO DB] MongoDB connection cleanly closed via application signal.');
  }
};
