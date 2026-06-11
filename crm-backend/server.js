// C:\Users\vagee\Desktop\CRM\crm-backend\server.js
console.log('--- Booting Server ---');
require('dotenv').config();
console.log('Loading express...');
const express = require('express');
console.log('Loading cors...');
const cors = require('cors');
console.log('Loading routes...');
const routes = require('./routes');
console.log('Modules loaded successfully!');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});
