/**
 * Conversation State Management
 * Uses SQLite for persistent conversation storage
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const dbPath = join(__dirname, '../../conversations.db');
const db = new Database(dbPath);

// Create conversations table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Create messages table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT,
    tool_call_id TEXT,
    name TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )
`);

console.log('[ConversationStore] Database initialized at', dbPath);

/**
 * Generate a unique conversation ID
 */
export function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new conversation
 */
export function createConversation(conversationId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO conversations (id)
    VALUES (?)
  `);

  stmt.run(conversationId);
  console.log(`[ConversationStore] Created conversation: ${conversationId}`);

  return conversationId;
}

/**
 * Add a message to a conversation
 */
export function addMessage(conversationId, message) {
  // Ensure conversation exists
  createConversation(conversationId);

  const stmt = db.prepare(`
    INSERT INTO messages (conversation_id, role, content, tool_calls, tool_call_id, name)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Serialize tool_calls if present
  const toolCallsJson = message.tool_calls ? JSON.stringify(message.tool_calls) : null;

  stmt.run(
    conversationId,
    message.role,
    message.content || '',
    toolCallsJson,
    message.tool_call_id || null,
    message.name || null
  );

  // Update conversation timestamp
  const updateStmt = db.prepare(`
    UPDATE conversations
    SET updated_at = strftime('%s', 'now')
    WHERE id = ?
  `);
  updateStmt.run(conversationId);

  console.log(`[ConversationStore] Added ${message.role} message to ${conversationId}`);
}

/**
 * Get all messages for a conversation
 */
export function getMessages(conversationId) {
  const stmt = db.prepare(`
    SELECT role, content, tool_calls, tool_call_id, name
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `);

  const rows = stmt.all(conversationId);

  // Parse tool_calls JSON
  const messages = rows.map(row => {
    const message = {
      role: row.role,
      content: row.content
    };

    if (row.tool_calls) {
      message.tool_calls = JSON.parse(row.tool_calls);
    }

    if (row.tool_call_id) {
      message.tool_call_id = row.tool_call_id;
    }

    if (row.name) {
      message.name = row.name;
    }

    return message;
  });

  console.log(`[ConversationStore] Retrieved ${messages.length} messages for ${conversationId}`);

  return messages;
}

/**
 * Get conversation metadata
 */
export function getConversation(conversationId) {
  const stmt = db.prepare(`
    SELECT id, created_at, updated_at
    FROM conversations
    WHERE id = ?
  `);

  const conversation = stmt.get(conversationId);

  if (!conversation) {
    return null;
  }

  return {
    id: conversation.id,
    createdAt: new Date(conversation.created_at * 1000).toISOString(),
    updatedAt: new Date(conversation.updated_at * 1000).toISOString()
  };
}

/**
 * Delete a conversation and all its messages
 */
export function deleteConversation(conversationId) {
  const deleteMessagesStmt = db.prepare(`
    DELETE FROM messages WHERE conversation_id = ?
  `);
  deleteMessagesStmt.run(conversationId);

  const deleteConvStmt = db.prepare(`
    DELETE FROM conversations WHERE id = ?
  `);
  deleteConvStmt.run(conversationId);

  console.log(`[ConversationStore] Deleted conversation: ${conversationId}`);
}

/**
 * Get all conversations
 */
export function getAllConversations() {
  const stmt = db.prepare(`
    SELECT c.id, c.created_at, c.updated_at,
           COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `);

  const rows = stmt.all();

  return rows.map(row => ({
    id: row.id,
    createdAt: new Date(row.created_at * 1000).toISOString(),
    updatedAt: new Date(row.updated_at * 1000).toISOString(),
    messageCount: row.message_count
  }));
}

// Close database connection on process exit
process.on('exit', () => {
  db.close();
  console.log('[ConversationStore] Database connection closed');
});
