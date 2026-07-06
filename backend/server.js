require('dotenv').config();
const compression = require('compression');

// 1. Fail-Fast Configuration check
const { validateEnv } = require('./config/envValidator');
validateEnv();

const express = require('express');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { apiLimiter, sanitizeQuery } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const { verifyStartupHealth } = require('./config/startupHealthCheck');
const worker = require('./worker');

const app = express();

// Register webhooks router before general JSON body parsing middleware
app.use('/api/webhooks', require('./routes/webhooks'));

// Trust the first reverse proxy (Nginx) for correct client IP in rate limiting
app.set('trust proxy', 1);

// Secure headers
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for simpler React bundler mounts
}));

// Gzip compression for API responses and static assets
app.use(compression());

// CORS rules — scoped to CLIENT_URL environment variable
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Express JSON limit sizes
app.use(express.json({ limit: '10mb' }));

// NoSQL injection guards
app.use(sanitizeQuery);

// General API request limits
app.use('/api', apiLimiter);

// Passport Auth configs
app.use(passport.initialize());
require('./config/passport')(passport);

// Endpoints definitions
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctor', require('./routes/doctors'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/health', require('./routes/health'));

app.get('/api/health-check', (_req, res) => {
  res.json({ status: 'ok', service: 'helio-backend' });
});

// React bundle serves
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Initialize background document queue listeners
require('./services/documentProcessingQueue');

const processType = process.env.PROCESS_TYPE || 'all';

async function startServer() {
  try {
    // 2. Establish database connection (with timeout and retry options)
    await connectDB();

    // 3. Service health check verification
    await verifyStartupHealth();

    // 4. Start HTTP Server
    if (processType === 'all' || processType === 'api') {
      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => console.log(`🚀 HELIO Server running on port ${PORT}`));

      // Graceful shutdown hooks for Express
      const shutdownServer = async (signal) => {
        console.log(`\n[Server] Received signal ${signal}. Closing HTTP listener...`);
        server.close(async () => {
          console.log('[Server] HTTP listener closed.');
          if (processType === 'all') {
            const OutboxService = require('./services/medication/OutboxService');
            const QueueService = require('./services/medication/QueueService');
            OutboxService.stop();
            try {
              await QueueService.stop(5000);
              await mongoose.connection.close();
              console.log('[Server] MongoDB connection closed cleanly. Exit.');
              process.exit(0);
            } catch (err) {
              console.error('[Server] Graceful exit failure:', err.message);
              process.exit(1);
            }
          } else {
            process.exit(0);
          }
        });
      };

      process.on('SIGTERM', () => shutdownServer('SIGTERM'));
      process.on('SIGINT', () => shutdownServer('SIGINT'));
    }

    // 5. Bootstrap workers dynamically
    await worker.bootstrap();

  } catch (err) {
    console.error('\n❌ CRITICAL: Platform startup failed during initialization:');
    console.error(`Reason: ${err.message}\n`);
    process.exit(1);
  }
}

startServer();
