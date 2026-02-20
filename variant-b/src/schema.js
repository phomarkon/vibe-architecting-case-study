import { z } from 'zod';

/**
 * Zod schema for validating LLM responses
 * Enforces structured output with intent classification and entity extraction
 */

export const ChatResponseSchema = z.object({
  intent: z.enum([
    'order_status',
    'return_request',
    'product_inquiry',
    'account_help',
    'general_question',
    'complaint',
    'unknown'
  ]).describe('Classified intent of the user message'),

  confidence: z.number()
    .min(0)
    .max(1)
    .describe('Confidence score between 0 and 1'),

  entities: z.object({
    orderId: z.string().optional().describe('Order ID if mentioned'),
    productName: z.string().optional().describe('Product name if mentioned'),
    email: z.string().email().optional().describe('Email address if mentioned'),
    accountId: z.string().optional().describe('Account ID if mentioned')
  }).describe('Extracted entities from the message'),

  response: z.string()
    .min(1)
    .max(500)
    .describe('Generated response to the user'),

  requiresHuman: z.boolean()
    .describe('Whether this needs escalation to human agent'),

  suggestedActions: z.array(z.string())
    .optional()
    .describe('Optional suggested follow-up actions')
});

export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long'),

  conversationId: z.string().optional()
});

/**
 * Type exports for TypeScript-style usage
 */
export const validateChatRequest = (data) => {
  return ChatRequestSchema.parse(data);
};

export const validateChatResponse = (data) => {
  return ChatResponseSchema.parse(data);
};
