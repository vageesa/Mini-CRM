require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    const prompt = `Given this PostgreSQL customer table schema: ${schema}, convert this request into a valid WHERE clause only, no explanation, no markdown: customers from hyderabad who spent above 1000`;
    
    console.log("Calling Gemini...");
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { maxOutputTokens: 200 }
    });

    console.log("Raw Response Text:", response.text);
    
    let sql_where_clause = response.text.trim();
    if (sql_where_clause.startsWith('```sql')) {
      sql_where_clause = sql_where_clause.replace(/```sql\n?/, '').replace(/```\n?$/, '').trim();
    } else if (sql_where_clause.startsWith('```')) {
      sql_where_clause = sql_where_clause.replace(/```\n?/, '').replace(/```\n?$/, '').trim();
    }
    console.log("Parsed SQL:", sql_where_clause);
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log("Testing with Prisma...");
    const countQuery = `SELECT COUNT(*) FROM "Customer" WHERE ${sql_where_clause}`;
    const result = await prisma.$queryRawUnsafe(countQuery);
    console.log("Success! Count:", result);
    await prisma.$disconnect();
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
