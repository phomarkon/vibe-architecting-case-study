import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeMessage, healthCheck } from './llm.js';
import { validateChatRequest } from './schema.js';
import { ZodError } from 'zod';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  const openaiHealth = await healthCheck();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      openai: openaiHealth.status
    }
  });
});

/**
 * Chat endpoint - processes customer messages
 */
app.post('/api/chat', async (req, res) => {
  try {
    // Validate request body
    const validatedRequest = validateChatRequest(req.body);
    const { message, conversationId } = validatedRequest;

    console.log(`[Chat] Processing message: "${message.substring(0, 50)}..."`);

    // Analyze message with LLM
    const result = await analyzeMessage(message, conversationId);

    // Log the response details
    console.log(`[Chat] Intent: ${result.intent}, Confidence: ${result.confidence}, Human: ${result.requiresHuman}`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Chat] Error:', error);

    if (error instanceof ZodError) {
      // Validation error
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({
        success: false,
        error: 'API configuration error'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      message: error.message
    });
  }
});

/**
 * Serve the web UI
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  Customer Service Chatbot - Variant B             ║
║  Structured JSON Output with Validation            ║
╟────────────────────────────────────────────────────╢
║  Server running on: http://localhost:${PORT}       ║
║  Health check:      http://localhost:${PORT}/api/health
╚════════════════════════════════════════════════════╝
  `);

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.warn('\n⚠️  WARNING: OPENAI_API_KEY not set in .env file\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
