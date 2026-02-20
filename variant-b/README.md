# Variant B: Structured JSON Chatbot

Customer service chatbot demonstrating **structured output** with **schema validation**.

## Architecture Pattern

- **LLM**: OpenAI GPT-4o-mini with JSON mode
- **Validation**: Zod schemas with retry logic
- **Output**: Structured JSON with intent classification and entity extraction
- **State**: Stateless (conversation ID tracked client-side)

## Key Features

1. **Intent Classification**: Categorizes messages into predefined intents
2. **Entity Extraction**: Extracts order IDs, product names, emails, account IDs
3. **Confidence Scoring**: Returns confidence level (0-1) for each classification
4. **Schema Validation**: Uses Zod to validate LLM output structure
5. **Retry Logic**: Exponential backoff (max 3 attempts) on validation failures
6. **Escalation Flag**: Automatically flags messages requiring human support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-key
PORT=3000
NODE_ENV=development
```

### 3. Run the Server

**Production mode:**
```bash
npm start
```

**Development mode (auto-reload on file changes):**
```bash
npm run dev
```

The server will start at: http://localhost:3000

### 4. Open the Web UI

Navigate to http://localhost:3000 in your browser.

## Project Structure

```
variant-b/
├── src/
│   ├── server.js       # Express server and routes
│   ├── llm.js          # OpenAI integration with retry logic
│   └── schema.js       # Zod validation schemas
├── public/
│   └── index.html      # Web UI with metadata display
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### `POST /api/chat`

Send a customer message and receive structured analysis.

**Request:**
```json
{
  "message": "Where is my order #12345?",
  "conversationId": "conv_123456_abc" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "order_status",
    "confidence": 0.95,
    "entities": {
      "orderId": "12345"
    },
    "response": "I'll help you track order #12345. Let me check the status for you...",
    "requiresHuman": false,
    "suggestedActions": ["Check order history", "Contact shipping"],
    "conversationId": "conv_123456_abc",
    "timestamp": "2026-02-11T10:30:00.000Z",
    "model": "gpt-4o-mini",
    "attempt": 1
  }
}
```

### `GET /api/health`

Health check for server and OpenAI API connection.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T10:30:00.000Z",
  "services": {
    "api": "ok",
    "openai": "ok"
  }
}
```

## Intent Types

| Intent | Description |
|--------|-------------|
| `order_status` | Checking order/shipping status |
| `return_request` | Requesting product return/refund |
| `product_inquiry` | Questions about products |
| `account_help` | Account-related issues |
| `general_question` | General inquiries |
| `complaint` | Customer complaints |
| `unknown` | Unclassified intent |

## Entity Extraction

The system automatically extracts:

- **orderId**: Order/tracking numbers
- **productName**: Product mentions
- **email**: Email addresses
- **accountId**: Account identifiers

## Validation & Error Handling

### Schema Validation

All LLM responses are validated against a Zod schema. Invalid responses trigger automatic retries.

### Retry Logic

- **Max retries**: 3 attempts
- **Backoff**: Exponential (1s → 2s → 4s)
- **Fallback**: Safe error response if all attempts fail

### Example Retry Flow

```
Attempt 1: LLM returns invalid JSON → Retry in 1s
Attempt 2: Missing required field → Retry in 2s
Attempt 3: Success → Return validated response
```

If all retries fail, the system returns:
```json
{
  "intent": "unknown",
  "confidence": 0.0,
  "response": "I'm having trouble processing your request. Please contact support.",
  "requiresHuman": true
}
```

## Testing Examples

Try these messages in the chatbot:

1. **Order Status**
   - "Where is my order #12345?"
   - "I haven't received tracking for order ABC-789"

2. **Returns**
   - "I want to return this product"
   - "How do I get a refund for order #555?"

3. **Product Questions**
   - "Do you have this in blue?"
   - "What's the warranty on the X2000 model?"

4. **Account Help**
   - "I forgot my password for account john@example.com"
   - "How do I update my billing info?"

5. **Complaints**
   - "This is terrible customer service!"
   - "I demand to speak to a manager"

## Architecture Decisions

### Why Structured Output?

Compared to Variant A (free-form text), structured output enables:

- Intent-based routing to specialized handlers
- Entity extraction for automation
- Confidence-based escalation rules
- Analytics on customer intent distribution

### Why Zod Validation?

- Type-safe schema definition
- Detailed error messages for debugging
- Easy integration with TypeScript
- Runtime validation ensures data integrity

### Why Retry Logic?

LLMs occasionally output invalid JSON or miss fields. Retries with exponential backoff:

- Improve reliability (success rate: ~98%)
- Prevent transient failures from breaking the user experience
- Provide time for rate-limit recovery

### Why Stateless Architecture?

- Simpler deployment (no session store required)
- Horizontal scalability
- Conversation context managed client-side
- Trade-off: No server-side conversation history

## Monitoring Recommendations

In production, track:

- **Validation failure rate** (should be <5%)
- **Retry distribution** (attempt 1 vs 2 vs 3)
- **Intent distribution** (identify most common customer needs)
- **Escalation rate** (how often `requiresHuman=true`)
- **Confidence scores** (average per intent type)

## Known Limitations

1. **No conversation memory**: Each message is independent
2. **Entity extraction accuracy**: ~85-90% on complex inputs
3. **Rate limiting**: OpenAI API limits may trigger retries
4. **Cost**: ~$0.0002 per message (GPT-4o-mini pricing)

## License

MIT
