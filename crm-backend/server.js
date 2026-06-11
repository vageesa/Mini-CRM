// C:\Users\vagee\Desktop\CRM\crm-backend\server.js
console.log('--- Booting Server ---');
require('dotenv').config();
console.log('Loading express...');
const express = require('express');
console.log('Loading cors...');
const cors = require('cors');
console.log('Loading routes...');

const app = express();
const PORT = process.env.PORT || 3000;

const lastErrors = [];

process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR:', err);
  lastErrors.push(err.toString());
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  lastErrors.push(reason.toString());
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', errors: lastErrors });
});

try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('Routes loaded successfully.');
} catch (error) {
  console.error('FAILED TO LOAD ROUTES:', error);
  lastErrors.push('Route Load Error: ' + error.toString());
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CRM Backend running on port ${PORT}`);
});
