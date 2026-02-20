# Variant C: Tool-Using Agent Chatbot

A customer service chatbot built with OpenAI GPT-4o-mini that autonomously uses tools to answer customer queries.

## Architecture

This variant demonstrates a tool-using agent pattern where the LLM decides which tools to call based on the conversation context. The agent can:

- **Search Knowledge Base** - Find product/service information
- **Lookup Customer Accounts** - Retrieve account details by ID or email
- **Escalate to Human** - Transfer complex issues to human agents

## Key Features

- **Autonomous Tool Selection** - GPT-4o-mini decides which tools to use
- **Multi-Tool Execution** - Agent can call multiple tools in sequence
- **Conversation History** - SQLite-based state management
- **Streaming Responses** - Real-time message streaming (optional)

## Prerequisites

- Node.js 18+ (for native `--watch` flag)
- OpenAI API key

## Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your OpenAI API key to .env
OPENAI_API_KEY=sk-your-key-here
```

## Running the Server

```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

The server will start on http://localhost:3000

## API Endpoints

### POST /api/chat

Send a message to the chatbot.

**Request:**
```json
{
  "message": "What is your return policy?",
  "conversationId": "abc123"
}
```

**Response:**
```json
{
  "response": "Our return policy allows...",
  "conversationId": "abc123",
  "toolsUsed": ["search_kb"]
}
```

### GET /api/conversation/:id

Retrieve conversation history.

**Response:**
```json
{
  "conversationId": "abc123",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

## Tool Definitions

### search_kb(query)

Searches the knowledge base for product/service information.

**Parameters:**
- `query` (string) - Search query

### get_account(identifier)

Looks up customer account by ID or email.

**Parameters:**
- `identifier` (string) - Customer ID or email address

### escalate_to_human(reason)

Escalates the conversation to a human agent.

**Parameters:**
- `reason` (string) - Reason for escalation

## Architecture Details

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────────┐
│         Express Server              │
│  ┌───────────────────────────────┐  │
│  │       Agent Loop              │  │
│  │                               │  │
│  │  1. Receive user message      │  │
│  │  2. Send to OpenAI            │  │
│  │  3. Execute tool calls        │  │
│  │  4. Send tool results back    │  │
│  │  5. Get final response        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ├─────────► OpenAI GPT-4o-mini
       │           (Function Calling)
       │
       └─────────► SQLite Database
                   (Conversation State)
```

## Differences from Other Variants

| Feature | Variant A | Variant B | Variant C |
|---------|-----------|-----------|-----------|
| LLM | GPT-3.5 | GPT-4o-mini | GPT-4o-mini |
| Pattern | Simple FAQ | Structured Output | Tool-Using Agent |
| Validation | None | Zod schemas | Tool schemas |
| State | Client-side | Stateless | Server-side (SQLite) |
| Tools | None | None | 3 tools |

## Example Conversations

**Knowledge Base Search:**
```
User: What is your return policy?
Assistant: [calls search_kb("return policy")]
Assistant: Our return policy allows returns within 30 days...
```

**Account Lookup:**
```
User: Can you check my account? My email is john@example.com
Assistant: [calls get_account("john@example.com")]
Assistant: I found your account, John. Your membership status is active...
```

**Multi-Tool Usage:**
```
User: I want to return my order #12345
Assistant: [calls get_account("12345"), then search_kb("return process")]
Assistant: I found your order. To process a return, please...
```

**Escalation:**
```
User: I need a refund for a damaged product
Assistant: [calls escalate_to_human("refund request for damaged product")]
Assistant: I've escalated your case to our support team. A specialist will contact you shortly.
```

## License

ISC
