import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDB, getDBStatus, closeDB } from './config/db.js';
import sessionMiddleware from './config/session.js';
import passport from './config/passport.js';
import { validateOriginCsrf } from './middleware/security.js';
import authRoutes from './routes/auth.routes.js';
import clinicalRoutes from './routes/clinical.routes.js';

/**
 * ============================================================================
 * HELIO Enterprise Medication Intelligence Platform
 * Core Express 5 Server Bootstrap (src/server.js)
 * ============================================================================
 * 
 * Architectural & Security Principles:
 * - Zero-JWT & Zero-Password: All authentication is strictly Google OAuth 2.0 backed by Redis.
 * - Stateful Sessions: connect-redis + express-session with rolling, secure, httpOnly cookies.
 * - CSRF Defense: Header-based Origin/Referer verification on state-mutating requests.
 * - Defense-in-depth: Helmet headers, strict CORS, rate-limiting, and sanitized payloads.
 * - Cryptographic Pairing Protocol: High-entropy Base-32 HL-XXXX-XXXX pairing engine.
 */

// Load environment variables before initializing dependent modules
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------------------------------------------------------------------------
// 1. Database Connection Initialization
// ---------------------------------------------------------------------------
connectDB();

// ---------------------------------------------------------------------------
// 2. Enterprise Security & Core Middlewares
// ---------------------------------------------------------------------------

// Apply Helmet with production-grade security headers
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Policy Configuration: Restrict API access to authorized frontend origins
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile clients, curl, Postman) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`[HELIO CORS] Access denied for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Payload compression for high-volume adherence logs and analytical metrics
app.use(compression());

// Body Parsers with defensive payload size limits to mitigate DoS vectors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// 3. Stateful Redis Session Engine & Security Layer (Zero-JWT / Zero-Password)
// ---------------------------------------------------------------------------
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(validateOriginCsrf);

// HTTP Request Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global API Rate Limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this client. Please retry after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/', apiRateLimiter);

// ---------------------------------------------------------------------------
// 4. Operational & Health Telemetry Endpoints
// ---------------------------------------------------------------------------
app.get(['/health', '/api/v1/health'], (req, res) => {
  const dbStatus = getDBStatus();
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbStatus.isConnected;
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'OPERATIONAL' : 'DEGRADED',
    platform: 'HELIO Medication Intelligence Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    environment: NODE_ENV,
    database: dbStatus,
    telemetry: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    },
  });
});

// Root Gateway Welcome
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'HELIO API Gateway',
    version: '1.0.0',
    description: 'Enterprise Medication Intelligence & Patient Adherence Platform',
    status: 'Active',
    docs: '/health',
  });
});

// ---------------------------------------------------------------------------
// 5. API Route Mount Points
// ---------------------------------------------------------------------------

// Authentication & Session Routes (Pure Google OAuth 2.0)
app.use('/api/auth', authRoutes);

// Clinical Protocol & Delegation Routes (Pairing, Cohorts, Audit Trail)
app.use('/api', clinicalRoutes);

// ---------------------------------------------------------------------------
// 6. 404 Route Catch-all
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'RESOURCE_NOT_FOUND',
  });
});

// ---------------------------------------------------------------------------
// 7. Centralized Error Handling Middleware
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[HELIO UNHANDLED ERROR]:', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
      code: 'DB_VALIDATION_ERROR',
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'uniqueField';
    return res.status(409).json({
      success: false,
      error: `Duplicate value entered for ${field}`,
      code: 'DUPLICATE_KEY_ERROR',
    });
  }

  // Rate Limiting or Custom Clinical Pairing Errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || 'CLINICAL_ERROR',
      remainingAttempts: err.remainingAttempts,
      remainingLockoutSeconds: err.remainingLockoutSeconds,
    });
  }

  // Default Internal Server Error
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ---------------------------------------------------------------------------
// 8. Server Initialization & Graceful Shutdown
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`
  =============================================================
  🌿 HELIO Medication Intelligence Platform - Backend API
  =============================================================
  🚀 Server Running On Port  : ${PORT}
  📡 Environment Mode        : ${NODE_ENV}
  🩺 Health Endpoint Check   : http://localhost:${PORT}/health
  🛡️  Security Policy         : Active (CSRF + Redis Sessions + RBAC)
  =============================================================
  `);
});

// Graceful Teardown Signals
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[HELIO SHUTDOWN] Received ${signal}. Initiating graceful teardown...`);

  server.close(async () => {
    console.log('[HELIO SHUTDOWN] HTTP server closed. Draining open connections.');
    await closeDB();
    console.log('[HELIO SHUTDOWN] All subsystems cleanly halted. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[HELIO SHUTDOWN FATAL] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
