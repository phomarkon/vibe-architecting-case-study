import OpenAI from 'openai';
import { ChatResponseSchema } from './schema.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt defining the chatbot's role and output format
const SYSTEM_PROMPT = `You are a helpful customer service assistant for an e-commerce company.

Your role is to:
1. Classify the customer's intent
2. Extract relevant entities (order IDs, product names, emails, account IDs)
3. Provide a helpful, concise response
4. Determine if the issue needs human escalation

Always respond with valid JSON matching this structure:
{
  "intent": "order_status" | "return_request" | "product_inquiry" | "account_help" | "general_question" | "complaint" | "unknown",
  "confidence": 0.0 to 1.0,
  "entities": {
    "orderId": "string (optional)",
    "productName": "string (optional)",
    "email": "string (optional)",
    "accountId": "string (optional)"
  },
  "response": "Your helpful response (1-500 chars)",
  "requiresHuman": boolean,
  "suggestedActions": ["action1", "action2"] (optional)
}

Guidelines:
- Set requiresHuman=true for: complaints, complex issues, refund requests over $100
- Be empathetic and professional
- Keep responses under 500 characters
- Extract ALL relevant entities from the message`;

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep helper for exponential backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyze customer message using OpenAI GPT-4o-mini with structured output
 * Implements retry logic with exponential backoff for validation failures
 */
export async function analyzeMessage(userMessage, conversationId = null) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Call OpenAI with JSON mode
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0].message.content;

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON from LLM: ${parseError.message}`);
      }

      // Validate against Zod schema
      const validatedResponse = ChatResponseSchema.parse(parsedResponse);

      // Log successful attempt
      console.log(`[LLM] Successfully validated response on attempt ${attempt + 1}`);

      return {
        ...validatedResponse,
        conversationId: conversationId || generateConversationId(),
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        attempt: attempt + 1
      };

    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      console.error(`[LLM] Attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on API key errors or rate limits
      if (error.code === 'invalid_api_key' || error.status === 429) {
        throw error;
      }

      if (!isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[LLM] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed, return fallback response
  console.error(`[LLM] All ${MAX_RETRIES} attempts failed. Using fallback.`);
  return createFallbackResponse(userMessage, lastError);
}

/**
 * Generate a safe fallback response when LLM fails validation
 */
function createFallbackResponse(userMessage, error) {
  return {
    intent: 'unknown',
    confidence: 0.0,
    entities: {},
    response: 'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team directly for immediate assistance.',
    requiresHuman: true,
    suggestedActions: ['Try rephrasing your question', 'Contact support directly'],
    conversationId: generateConversationId(),
    timestamp: new Date().toISOString(),
    model: 'fallback',
    error: error.message,
    attempt: MAX_RETRIES
  };
}

/**
 * Generate a simple conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Health check for OpenAI API
 */
export async function healthCheck() {
  try {
    await openai.models.list();
    return { status: 'ok', service: 'openai' };
  } catch (error) {
    return {
      status: 'error',
      service: 'openai',
      message: error.message
    };
  }
}
