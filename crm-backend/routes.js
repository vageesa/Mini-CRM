// C:\Users\vagee\Desktop\CRM\crm-backend\routes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy',
});

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';

/**
 * GET /api/customers
 * List customers with optional search and filters
 */
router.get('/customers', async (req, res) => {
  try {
    const { search, city } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city) {
      where.city = city;
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * POST /api/segments
 * Save a new segment
 */
router.post('/segments', async (req, res) => {
  try {
    const { name, query_description, sql_where_clause } = req.body;
    
    // Calculate customer count by running the raw SQL
    const countQuery = `SELECT COUNT(*) FROM "Customer" WHERE ${sql_where_clause}`;
    const result = await prisma.$queryRawUnsafe(countQuery);
    const customer_count = Number(result[0].count);

    const segment = await prisma.segment.create({
      data: {
        name,
        query_description,
        sql_where_clause,
        customer_count,
      },
    });
    res.json(segment);
  } catch (error) {
    console.error('Error saving segment:', error);
    res.status(500).json({ error: 'Failed to save segment' });
  }
});

/**
 * GET /api/segments
 * List all segments
 */
router.get('/segments', async (req, res) => {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

/**
 * POST /api/campaigns
 * Create and send a campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const { name, segment_id, channel, message } = req.body;
    
    const segment = await prisma.segment.findUnique({ where: { id: segment_id } });
    if (!segment) return res.status(404).json({ error: 'Segment not found' });

    // Fetch customers for this segment using raw SQL
    const query = `SELECT id, name, email, phone FROM "Customer" WHERE ${segment.sql_where_clause}`;
    const customers = await prisma.$queryRawUnsafe(query);

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segment_id,
        channel,
        message,
        status: 'sending',
      },
    });

    // Create communications in DB and send to Channel Service
    const commsData = customers.map(c => ({
      campaign_id: campaign.id,
      customer_id: c.id,
      channel,
      message,
      status: 'sent',
    }));
    
    await prisma.communication.createMany({
      data: commsData,
    });

    const communications = await prisma.communication.findMany({
      where: { campaign_id: campaign.id }
    });

    // Send async requests to Channel Service
    for (const comm of communications) {
      const customer = customers.find(c => c.id === comm.customer_id);
      const recipient = channel === 'Email' ? customer.email : customer.phone;
      
      axios.post(`${CHANNEL_SERVICE_URL}/send`, {
        communication_id: comm.id,
        recipient,
        message,
        channel,
        campaign_id: campaign.id
      }).catch(err => console.error(`Failed to send comm ${comm.id} to Channel Service`, err.message));
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { segment: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/campaigns/:id/stats
 * Stats for a single campaign
 */
router.get('/campaigns/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await prisma.communication.groupBy({
      by: ['status'],
      where: { campaign_id: id },
      _count: {
        status: true,
      },
    });

    const formattedStats = {
      total: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    };

    stats.forEach(stat => {
      formattedStats[stat.status] = stat._count.status;
      formattedStats.total += stat._count.status;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/receipts
 * Receive delivery callback from Channel Service
 */
router.post('/receipts', async (req, res) => {
  try {
    const { communication_id, status, timestamp } = req.body;
    
    await prisma.communication.update({
      where: { id: communication_id },
      data: { status, updated_at: new Date(timestamp || Date.now()) },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

/**
 * POST /api/ai/segment
 * Claude generates SQL WHERE clause
 */
router.post('/ai/segment', async (req, res) => {
  try {
    const { query } = req.body;
    const schema = `
      Customer {
        id                 String   @id @default(uuid())
        name               String
        email              String   @unique
        phone              String
        city               String
        total_spend        Float
        last_purchase_date DateTime
        purchase_count     Int
        created_at         DateTime @default(now())
      }
    `;
    
    const prompt = `Given this PostgreSQL customer table schema: ${schema}, convert this request into a valid WHERE clause only, no explanation, no markdown: ${query}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 200 }
    });

    let sql_where_clause = response.text.trim();
    if (sql_where_clause.startsWith('```sql')) {
      sql_where_clause = sql_where_clause.replace(/```sql\n?/, '').replace(/```\n?$/, '').trim();
    } else if (sql_where_clause.startsWith('```')) {
      sql_where_clause = sql_where_clause.replace(/```\n?/, '').replace(/```\n?$/, '').trim();
    }

    const countQuery = `SELECT COUNT(*) FROM "Customer" WHERE ${sql_where_clause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery);
    
    res.json({
      sql_where_clause,
      customer_count: Number(countResult[0].count)
    });
  } catch (error) {
    console.error('Error generating segment:', error);
    res.status(500).json({ error: 'Failed to generate segment. Please try rephrasing.' });
  }
});

/**
 * POST /api/ai/message
 * Claude generates campaign message
 */
router.post('/ai/message', async (req, res) => {
  try {
    const { channel, segment_description } = req.body;
    const prompt = `Generate a short marketing message under 160 characters for a ${channel} campaign targeting ${segment_description} for an Indian fashion/lifestyle brand. Return only the message, no explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 150 }
    });

    res.json({ message: response.text.trim() });
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

module.exports = router;
