/**
 * Express Server
 * Main server file for the chatbot API
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { runAgent } from './agent.js';
import {
  generateConversationId,
  createConversation,
  addMessage,
  getMessages,
  getConversation,
  getAllConversations
} from './state/conversationStore.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Use provided conversationId or create a new one
    const convId = conversationId || generateConversationId();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Server] Processing message for conversation: ${convId}`);
    console.log(`[Server] User message: "${message}"`);
    console.log('='.repeat(60));

    // Get existing conversation history
    const history = getMessages(convId);

    // Add user message to conversation
    addMessage(convId, {
      role: 'user',
      content: message
    });

    // Prepare messages for agent (exclude tool messages for cleaner context)
    const messagesForAgent = [
      ...history.filter(msg => msg.role !== 'tool'),
      { role: 'user', content: message }
    ];

    // Run the agent
    const result = await runAgent(messagesForAgent);

    // Store all new messages (including tool calls and responses)
    const newMessages = result.messages.slice(messagesForAgent.length);

    for (const msg of newMessages) {
      addMessage(convId, msg);
    }

    console.log(`[Server] Response: "${result.response}"`);
    console.log(`[Server] Tools used: ${result.toolsUsed.join(', ') || 'none'}`);

    res.json({
      response: result.response,
      conversationId: convId,
      toolsUsed: result.toolsUsed
    });

  } catch (error) {
    console.error('[Server] Error processing chat:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        error: 'OpenAI API quota exceeded. Please check your API key and billing settings.'
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        error: 'Invalid OpenAI API key. Please check your .env configuration.'
      });
    }

    res.status(500).json({
      error: 'An error occurred processing your request',
      details: error.message
    });
  }
});

// Get conversation history
app.get('/api/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    const messages = getMessages(id);

    res.json({
      ...conversation,
      messages: messages.filter(msg => msg.role !== 'system' && msg.role !== 'tool')
    });

  } catch (error) {
    console.error('[Server] Error fetching conversation:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation'
    });
  }
});

// List all conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = getAllConversations();

    res.json({
      conversations,
      total: conversations.length
    });

  } catch (error) {
    console.error('[Server] Error listing conversations:', error);
    res.status(500).json({
      error: 'Failed to list conversations'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 Variant C: Tool-Using Agent Chatbot');
  console.log('='.repeat(60));
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Using OpenAI GPT-4o-mini with function calling`);
  console.log(`✓ SQLite database for conversation state`);
  console.log('\nAvailable endpoints:');
  console.log(`  POST   http://localhost:${PORT}/api/chat`);
  console.log(`  GET    http://localhost:${PORT}/api/conversation/:id`);
  console.log(`  GET    http://localhost:${PORT}/api/conversations`);
  console.log(`  GET    http://localhost:${PORT}/api/health`);
  console.log('\n' + '='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received, shutting down gracefully...');
  process.exit(0);
});
