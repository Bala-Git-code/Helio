require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const connectDB = require('./config/db');
const { apiLimiter, sanitizeQuery } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Secure headers
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for simpler React bundler mounts
}));

// CORS rules
app.use(cors({ origin: true, credentials: true }));

// Express JSON limit sizes
app.use(express.json({ limit: '10mb' }));

// NoSQL injection guards
app.use(sanitizeQuery);

// General API request limits
app.use('/api', apiLimiter);

// Passport Auth configs
app.use(passport.initialize());
require('./config/passport')(passport);

// Establish database connection
connectDB();

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

// Initialize background queues
require('./services/documentProcessingQueue');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
