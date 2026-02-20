import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let openai;
let faqContext = '';

/**
 * Initialize OpenAI client and load FAQ data
 */
export async function initChatHandler() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Load FAQ data
  const faqPath = path.join(__dirname, 'faq.json');
  const faqData = JSON.parse(await fs.readFile(faqPath, 'utf-8'));

  // Build FAQ context string for the system prompt
  faqContext = faqData
    .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
    .join('\n\n');

  console.log('Chat handler initialized with FAQ knowledge base');
}

/**
 * Handle incoming chat messages
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The chatbot's response
 */
export async function handleChatMessage(userMessage) {
  if (!openai) {
    throw new Error('Chat handler not initialized. Call initChatHandler() first.');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer service assistant. Answer user questions based on the following FAQ knowledge base. If the question is not covered in the FAQs, politely say you don't have that information and suggest contacting support at support@example.com.

FAQ Knowledge Base:
${faqContext}

Guidelines:
- Be friendly and professional
- Keep answers concise
- Use information from the FAQ when relevant
- If unsure, suggest contacting human support
- Don't make up information not in the FAQs`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}
