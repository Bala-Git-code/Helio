require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

require('./config/passport')(passport);
connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/health', require('./routes/health'));

app.get('/api/health-check', (_req, res) => {
  res.json({ status: 'ok', service: 'helio-backend' });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
