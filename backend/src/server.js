import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDB, getDBStatus, closeDB } from './config/db.js';

/**
 * ============================================================================
 * HELIO Medication Intelligence Platform
 * Core Express 5 Server Bootstrap
 * ============================================================================
 * 
 * Architectural Overview:
 * This server orchestrates clinical workflow APIs, patient adherence tracking,
 * drug-drug interaction validation engines, and Gemini AI-assisted health consultations.
 * 
 * Compliance & Enterprise Design Principles:
 * - Express 5 Native Promise Handling: Asynchronous route handlers natively catch rejections.
 * - Defense-in-depth: Helmet headers, strict CORS, rate-limiting, and sanitized payloads.
 * - Operational Telemetry: Detailed health check probe (`/health`), memory, and DB connection status.
 * - Graceful Degradation & Teardown: Handles zero-downtime restarts and socket draining.
 */

// Load environment variables before initializing dependent modules
dotenv.config();

// Instantiate foundational Express 5 Application
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

// Apply Helmet to protect against common web vulnerabilities (XSS, Clickjacking, MIME-sniffing)
app.use(
  helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Policy Configuration: Restrict API access to authorized frontend origins (e.g., Vite dev / production domain)
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman) in development
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

// HTTP Request Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Apache combined format for production log aggregators (e.g., Datadog, CloudWatch)
  app.use(morgan('combined'));
}

// Global API Rate Limiter: Protect endpoints against brute force and automated scraping
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this client. Please retry after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/', apiRateLimiter);

// ---------------------------------------------------------------------------
// 3. Operational & Health Telemetry Endpoints
// ---------------------------------------------------------------------------

/**
 * Liveness & Readiness Probe
 * Utilized by container orchestrators (Kubernetes/ECS) and uptime monitoring
 */
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

// ---------------------------------------------------------------------------
// 4. API Route Mount Points (Modular Architecture)
// ---------------------------------------------------------------------------

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'HELIO API Gateway',
    version: '1.0.0',
    description: 'Enterprise Medication Intelligence & Patient Adherence Platform',
    status: 'Active',
    docs: '/api/v1/health',
  });
});

// Future Route Registrations will be mounted under /api/v1:
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/patients', patientRoutes);
// app.use('/api/v1/medications', medicationRoutes);
// app.use('/api/v1/prescriptions', prescriptionRoutes);
// app.use('/api/v1/adherence', adherenceRoutes);
// app.use('/api/v1/interactions', interactionRoutes);
// app.use('/api/v1/ai-consultation', aiConsultationRoutes);

// ---------------------------------------------------------------------------
// 5. 404 Route Catch-all
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'RESOURCE_NOT_FOUND',
  });
});

// ---------------------------------------------------------------------------
// 6. Centralized Error Handling Middleware (Express 5 Signature)
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

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value entered for ${field}`,
      code: 'DUPLICATE_KEY_ERROR',
    });
  }

  // JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'AUTH_INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token has expired',
      code: 'AUTH_TOKEN_EXPIRED',
    });
  }

  // Default Internal Server Error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ---------------------------------------------------------------------------
// 7. Server Initialization & Graceful Shutdown
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`
  =============================================================
  🌿 HELIO Medication Intelligence Platform - Backend API
  =============================================================
  🚀 Server Running On Port  : ${PORT}
  📡 Environment Mode        : ${NODE_ENV}
  🩺 Health Endpoint Check   : http://localhost:${PORT}/health
  🛡️  Security Policy         : Active (Helmet + CORS + RateLimit)
  =============================================================
  `);
});

// Graceful Shutdown Signals (Kubernetes / Docker / Process Manager)
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[HELIO SHUTDOWN] Received ${signal}. Initiating graceful teardown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('[HELIO SHUTDOWN] HTTP server closed. Draining existing connections.');

    // Close Database Pool cleanly
    await closeDB();

    console.log('[HELIO SHUTDOWN] All subsystems cleanly halted. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 10 seconds
  setTimeout(() => {
    console.error('[HELIO SHUTDOWN FATAL] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
