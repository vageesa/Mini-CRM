// C:\Users\vagee\Desktop\CRM\channel-service\index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:3000/api/receipts';

app.use(cors());
app.use(express.json());

// In-memory store just for logs/debugging
const communications = [];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendCallbackWithRetry = async (payload, retryCount = 0) => {
  try {
    await axios.post(CRM_CALLBACK_URL, payload);
    console.log(`[SUCCESS] Callback sent for comm: ${payload.communication_id} with status: ${payload.status}`);
  } catch (error) {
    console.error(`[ERROR] Callback failed for comm: ${payload.communication_id}. Retry count: ${retryCount}`);
    if (retryCount < 3) {
      const backoff = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await sleep(backoff);
      await sendCallbackWithRetry(payload, retryCount + 1);
    } else {
      console.error(`[FATAL] Callback permanently failed for comm: ${payload.communication_id}`);
    }
  }
};

/**
 * POST /send
 * Receives communication request and simulates async delivery
 */
app.post('/send', (req, res) => {
  const { communication_id, recipient, message, channel, campaign_id } = req.body;

  if (!communication_id) {
    return res.status(400).json({ error: 'communication_id is required' });
  }

  console.log(`[RECEIVED] Comm ${communication_id} to ${recipient} via ${channel}`);
  communications.push({ communication_id, status: 'processing' });

  // Return 200 OK immediately
  res.sendStatus(200);

  // Async simulation
  const delay = Math.floor(Math.random() * 3000) + 2000; // 2000-5000ms

  setTimeout(() => {
    // Probabilities: delivered 60%, opened 20%, clicked 10%, failed 10%
    const rand = Math.random();
    let finalStatus = 'failed';
    
    if (rand < 0.6) {
      finalStatus = 'delivered';
    } else if (rand < 0.8) {
      finalStatus = 'opened';
    } else if (rand < 0.9) {
      finalStatus = 'clicked';
    }

    console.log(`[SIMULATED] Comm ${communication_id} final status: ${finalStatus} after ${delay}ms`);

    const payload = {
      communication_id,
      status: finalStatus,
      timestamp: new Date().toISOString()
    };

    sendCallbackWithRetry(payload);

  }, delay);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', pending_logs: communications.length });
});

app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
});
