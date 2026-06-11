require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
async function run() {
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  try {
    const res = await ai.models.generateContent({model: 'gemini-1.5-flash', contents: 'hi'});
    console.log("1.5 flash:", res.text);
  } catch (e) {
    console.log("1.5 flash failed:", e.message);
  }
  try {
    const res = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'hi'});
    console.log("2.5 flash:", res.text);
  } catch (e) {
    console.log("2.5 flash failed:", e.message);
  }
}
run();
