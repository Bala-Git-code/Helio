import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';

import { configurePassport } from './config/passport.js';
import { startOutboxPublisher, stopOutboxPublisher } from './services/outboxPublisher.js';
import { startQueueWorker, stopQueueWorker } from './services/queueWorker.js';

import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patient.js';
import doctorRoutes from './routes/doctor.js';
import aiRoutes from './routes/ai.js';
import webhookRoutes from './routes/webhooks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares & Sanitization
app.use(helmet());
app.use(mongoSanitize({ replaceWith: '_' }));

// Skip rate limiting during automated Jest integration tests
const skipInTest = () => process.env.NODE_ENV === 'test';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'General API rate limit exceeded. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  skip: skipInTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI processing quota limit reached for this hour.' },
});

app.use('/api', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/ai', aiLimiter);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport Configuration
configurePassport();
app.use(passport.initialize());

// API Route Modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/doctor', doctorRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    platform: 'HELIO Enterprise Medication Intelligence Platform',
    timestamp: new Date(),
    mongoState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[HELIO Server Error]', err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

let server = null;

export const startServer = async () => {
  try {
    // Start listening on HTTP port immediately
    server = app.listen(PORT, () => {
      console.log(`[HELIO Platform Engine] Server listening on port ${PORT}`);
    });

    let mongoUri = process.env.LOCAL_MONGO_ONLY === 'true' ? 'mongodb://127.0.0.1:27017/helio' : (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helio');
    console.log('[MongoDB] Connecting to database...');

    const mongoOpts = {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
    };

    try {
      await mongoose.connect(mongoUri, mongoOpts);
    } catch (primaryErr) {
      console.warn('[MongoDB] Primary MONGO_URI failed, attempting local MongoDB fallback...');
      mongoUri = 'mongodb://127.0.0.1:27017/helio';
      await mongoose.connect(mongoUri, mongoOpts);
    }

    console.log('[MongoDB] Connected successfully with maxPoolSize: 50.');

    startOutboxPublisher(5000);
    startQueueWorker(3000);
  } catch (err) {
    console.error('[MongoDB Connection Error]', err.message);
  }
};

// Launch automatically if not running in Jest test runner
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Graceful Shutdown Handlers (SIGTERM / SIGINT)
const gracefulShutdown = (signal) => {
  console.log(`\n[HELIO Engine] ${signal} received. Initiating graceful shutdown...`);

  stopOutboxPublisher();
  stopQueueWorker();

  if (server) {
    server.close(async () => {
      console.log('[HELIO Engine] HTTP server closed.');
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
