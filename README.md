# AI-Native Mini CRM

A complete AI-native CRM with a React/Tailwind frontend, Node.js/Express backend (Prisma + PostgreSQL), and a simulated Channel Service for sending messages. It uses the Anthropic Claude API to generate dynamic SQL segmentation queries and AI marketing messages.

## Folder Structure

- `/crm-backend`: Node.js Express server handling the API, AI segmentation, and database via Prisma.
- `/crm-frontend`: React frontend using Vite and Tailwind CSS.
- `/channel-service`: Separate Express microservice to simulate sending emails, SMS, and WhatsApp messages with async delivery callbacks.

## Setup Instructions

### 1. Database & Backend
1. cd `crm-backend`
2. `npm install`
3. Setup `.env` (use `.env.example` as a template with your `DATABASE_URL` and `ANTHROPIC_API_KEY`).
4. Initialize the DB: `npx prisma db push`
5. Seed data: `node seed.js`
6. Start the backend: `npm start` (Runs on port 3000)

### 2. Channel Service
1. cd `channel-service`
2. `npm install`
3. Start the service: `npm start` (Runs on port 3001)

### 3. Frontend
1. cd `crm-frontend`
2. `npm install`
3. Setup `.env` for the API URL (`VITE_API_URL=http://localhost:3000`)
4. Start the app: `npm run dev` (Runs on port 5173)

## Deployment Checklist
See the deployment guide provided at the end of the conversation.
