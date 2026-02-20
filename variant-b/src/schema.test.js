import { test } from 'node:test';
import assert from 'node:assert';
import { ChatResponseSchema, ChatRequestSchema } from './schema.js';

test('ChatResponseSchema validates correct structure', () => {
  const validResponse = {
    intent: 'order_status',
    confidence: 0.95,
    entities: {
      orderId: '12345'
    },
    response: 'I will help you track your order.',
    requiresHuman: false,
    suggestedActions: ['Check order history']
  };

  const result = ChatResponseSchema.parse(validResponse);
  assert.strictEqual(result.intent, 'order_status');
  assert.strictEqual(result.confidence, 0.95);
});

test('ChatResponseSchema rejects invalid intent', () => {
  const invalidResponse = {
    intent: 'invalid_intent',
    confidence: 0.95,
    entities: {},
    response: 'Test',
    requiresHuman: false
  };

  assert.throws(() => {
    ChatResponseSchema.parse(invalidResponse);
  });
});

test('ChatResponseSchema rejects confidence out of range', () => {
  const invalidResponse = {
    intent: 'order_status',
    confidence: 1.5, // Invalid: must be 0-1
    entities: {},
    response: 'Test',
    requiresHuman: false
  };

  assert.throws(() => {
    ChatResponseSchema.parse(invalidResponse);
  });
});

test('ChatRequestSchema validates correct message', () => {
  const validRequest = {
    message: 'Where is my order?',
    conversationId: 'conv_123'
  };

  const result = ChatRequestSchema.parse(validRequest);
  assert.strictEqual(result.message, 'Where is my order?');
});

test('ChatRequestSchema rejects empty message', () => {
  const invalidRequest = {
    message: '',
    conversationId: 'conv_123'
  };

  assert.throws(() => {
    ChatRequestSchema.parse(invalidRequest);
  });
});

test('ChatRequestSchema rejects message too long', () => {
  const invalidRequest = {
    message: 'a'.repeat(501) // Too long
  };

  assert.throws(() => {
    ChatRequestSchema.parse(invalidRequest);
  });
});

test('ChatResponseSchema allows optional email entity', () => {
  const validResponse = {
    intent: 'account_help',
    confidence: 0.88,
    entities: {
      email: 'user@example.com'
    },
    response: 'I will help with your account.',
    requiresHuman: false
  };

  const result = ChatResponseSchema.parse(validResponse);
  assert.strictEqual(result.entities.email, 'user@example.com');
});

test('ChatResponseSchema validates requiresHuman is boolean', () => {
  const invalidResponse = {
    intent: 'complaint',
    confidence: 0.75,
    entities: {},
    response: 'I understand your frustration.',
    requiresHuman: 'yes' // Invalid: must be boolean
  };

  assert.throws(() => {
    ChatResponseSchema.parse(invalidResponse);
  });
});
