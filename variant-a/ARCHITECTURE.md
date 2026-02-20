# Variant A: Architecture Documentation

## Overview

Variant A demonstrates the **simplest possible architecture** for an AI-powered customer service chatbot. The entire system is built around injecting FAQ context into a GPT-4o-mini system prompt and returning free-form text responses.

## Architectural Pattern: Simple Context Injection

This variant uses the **Prompt Constraint (1A)** pattern from the SAGAI paper taxonomy:
- FAQ knowledge is injected directly into the system prompt
- No structured output format enforced
- No validation or retry logic
- Stateless request-response model

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  index.html                                         │ │
│  │  - Chat UI                                          │ │
│  │  - Client-side conversation history (in-memory)    │ │
│  │  - Event handlers for user input                   │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST /api/chat
                        │ { message: "user question" }
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Server                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  server.js                                          │ │
│  │  - Route handling                                   │ │
│  │  - Request validation (basic)                       │ │
│  │  - Static file serving                              │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ handleChatMessage(userMessage)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Chat Handler                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  chatHandler.js                                     │ │
│  │  - OpenAI SDK client                                │ │
│  │  - FAQ context loaded at startup                    │ │
│  │  - System prompt construction                       │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ API call with FAQ context
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   OpenAI GPT-4o-mini                     │
│  - Processes system prompt + user message               │
│  - Returns free-form text response                      │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend (public/index.html)

**Responsibilities:**
- Display chat interface
- Handle user input
- Show typing indicators
- Display messages

**State Management:**
- Conversation history stored in DOM only
- Lost on page refresh
- No persistence layer

**Key Design Decision:**
*Why no framework (React, Vue)?*
- Keep variant A maximally simple
- Reduce dependencies
- Show that AI doesn't require complex frontend

### 2. Server (server.js)

**Responsibilities:**
- Serve static files
- Route `/api/chat` requests
- Basic input validation
- Error handling

**What it does NOT do:**
- Session management
- Authentication
- Rate limiting
- Logging beyond console

**Key Design Decision:**
*Why Express instead of Next.js?*
- Variant A focuses on backend simplicity
- No need for SSR or file-based routing
- Easier to understand for non-frontend developers

### 3. Chat Handler (chatHandler.js)

**Responsibilities:**
- Initialize OpenAI client
- Load FAQ data at startup
- Construct system prompt with FAQ context
- Make API calls
- Return responses

**Lifecycle:**
```
App Start
   ↓
initChatHandler()
   ↓
Load faq.json
   ↓
Build FAQ context string
   ↓
Ready to handle requests
```

**Key Design Decision:**
*Why load FAQ once at startup instead of per-request?*
- FAQ rarely changes during runtime
- Reduces file I/O overhead
- Simpler code (no caching layer needed)

**Trade-off:**
- Must restart server to update FAQs
- Acceptable for this simple variant

### 4. FAQ Data (faq.json)

**Structure:**
```json
[
  {
    "question": "...",
    "answer": "..."
  }
]
```

**How it's used:**
- Loaded at server startup
- Converted to plain text format for prompt injection
- Embedded in system message for every request

**Key Design Decision:**
*Why JSON instead of a database?*
- 10 FAQs fit easily in JSON
- No need for queries or indexing
- Version controlled with code
- Easy to edit

**Scalability limit:**
- Works up to ~50 FAQs before hitting token limits
- For more, would need vector DB (see Variant C)

## Data Flow

### Request Flow

```
1. User types message in browser
      ↓
2. Frontend sends POST to /api/chat
      Body: { message: "What are your hours?" }
      ↓
3. Server validates message
      - Check if string
      - Check if not empty
      ↓
4. Server calls handleChatMessage(message)
      ↓
5. ChatHandler builds prompt:
      System: "You are a customer service assistant.
               Answer based on this FAQ:
               Q: What are your business hours?
               A: Monday-Friday, 9 AM to 6 PM EST..."
      User: "What are your hours?"
      ↓
6. OpenAI API call
      Model: gpt-4o-mini
      Temperature: 0.7
      Max tokens: 300
      ↓
7. OpenAI returns response
      "We're open Monday through Friday, 9 AM to 6 PM EST.
       Weekend support is available via email."
      ↓
8. Server sends JSON response
      { response: "...", timestamp: "..." }
      ↓
9. Frontend displays bot message
```

### Error Flow

```
API call fails
      ↓
chatHandler.js throws error
      ↓
server.js catches in try-catch
      ↓
Returns 500 with generic error message
      ↓
Frontend shows error in chat
```

## Prompt Engineering Strategy

### System Prompt Template

```
You are a helpful customer service assistant.
Answer user questions based on the following FAQ knowledge base.
If the question is not covered in the FAQs, politely say you don't have
that information and suggest contacting support at support@example.com.

FAQ Knowledge Base:
Q: What are your business hours?
A: We're open Monday through Friday, 9 AM to 6 PM EST...

Q: How do I reset my password?
A: Click 'Forgot Password' on the login page...

[... more FAQs ...]

Guidelines:
- Be friendly and professional
- Keep answers concise
- Use information from the FAQ when relevant
- If unsure, suggest contacting human support
- Don't make up information not in the FAQs
```

**Why this structure?**
1. **Role definition**: Establishes helpful tone
2. **Knowledge injection**: All FAQ content in one block
3. **Fallback behavior**: Explicit instructions for out-of-scope questions
4. **Guardrails**: Guidelines prevent hallucination

**Token usage:**
- System prompt: ~500 tokens (depends on FAQ size)
- User message: ~20 tokens (average)
- Response: ~100 tokens (average)
- **Total per request: ~620 tokens**

## Architectural Constraints

### What This Architecture CANNOT Do

1. **Multi-turn context**: Each request is independent
   - User: "What are your hours?"
   - Bot: "9 AM to 6 PM EST"
   - User: "What about weekends?" ❌ Bot doesn't remember previous question

2. **Structured data extraction**: No guarantee of format
   - Can't reliably parse order IDs, tracking numbers, etc.

3. **Action execution**: No way to trigger side effects
   - Can't create tickets, look up orders, etc.

4. **Conversation history**: Lost on page refresh

5. **Rate limiting**: Any user can spam requests

### Design Choices Explained

| Choice | Rationale | Trade-off |
|--------|-----------|-----------|
| No database | FAQs fit in JSON file | Must restart to update FAQs |
| No auth | Not needed for public FAQ bot | Can't personalize responses |
| No state | Keeps code simple | No conversation context |
| No validation | Trust LLM output | Unpredictable response format |
| Client-side history | No backend needed | Lost on refresh |

## Comparison to Other Variants

| Feature | Variant A | Variant B | Variant C |
|---------|-----------|-----------|-----------|
| **LLM** | GPT-4o-mini | GPT-4o-mini | Claude 3.5 Sonnet |
| **Output** | Free-form text | JSON schema | Tool calls |
| **Validation** | None | Zod schemas | Tool schemas |
| **State** | Client-side | Stateless | SQLite DB |
| **Retry** | None | Exponential backoff | Agent loop |
| **Context** | FAQ in prompt | FAQ in prompt | Vector DB (RAG) |
| **Cost/request** | $0.0001 | $0.0002 | $0.001 |
| **Complexity** | Low | Medium | High |

**When to use Variant A:**
- Public FAQ chatbot
- Read-only information retrieval
- Budget-conscious projects
- Proof of concept / MVP

**When NOT to use Variant A:**
- Need structured output (use Variant B)
- Need to execute actions (use Variant C)
- Need conversation history (use Variant C)
- Need high reliability (use Variant B with validation)

## Security Considerations

### Current State (Development)

- ✅ API key in environment variable
- ✅ Basic input validation (non-empty string)
- ❌ No rate limiting
- ❌ No authentication
- ❌ No input sanitization beyond trim()
- ❌ No logging/monitoring

### Production Recommendations

If deploying this variant to production:

1. **Add rate limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/chat', limiter);
```

2. **Add input sanitization:**
```javascript
import validator from 'validator';

if (!validator.isLength(message, { min: 1, max: 500 })) {
  return res.status(400).json({ error: 'Message too long' });
}
```

3. **Add monitoring:**
```javascript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## Performance Characteristics

**Typical Response Times:**
- FAQ loading at startup: 5ms
- API request processing: 1-3 seconds
- Frontend rendering: <50ms

**Bottleneck:** OpenAI API call (network + model inference)

**Optimization opportunities:**
- Cache common questions (but this variant intentionally skips caching)
- Use streaming responses (but adds frontend complexity)
- Reduce max_tokens (but may cut off responses)

**Not optimized for:**
- High concurrency (no connection pooling)
- Low latency (<1s responses)

## Code Organization

```
variant-a/
├── server.js              # Entry point, Express setup, routing
├── chatHandler.js         # OpenAI logic, FAQ loading
├── faq.json              # Data (knowledge base)
├── public/
│   └── index.html        # Frontend (UI + client logic in one file)
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md             # Usage instructions
```

**Separation of Concerns:**
- `server.js`: HTTP layer
- `chatHandler.js`: Business logic (LLM interaction)
- `faq.json`: Data layer
- `index.html`: Presentation layer

**Why not further split?**
- Each file is <150 lines
- Clear responsibilities
- No need for additional abstraction at this scale

## Testing Strategy

**Not included in this variant:**
- Unit tests
- Integration tests
- E2E tests

**Why?**
- Demonstrates minimum viable implementation
- Testing is covered in paper's "production considerations" section

**If adding tests:**
```javascript
// Example: chatHandler.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { initChatHandler, handleChatMessage } from './chatHandler.js';

describe('chatHandler', () => {
  beforeAll(async () => {
    await initChatHandler();
  });

  it('should respond to FAQ question', async () => {
    const response = await handleChatMessage('What are your business hours?');
    expect(response).toContain('9 AM to 6 PM');
  });
});
```

## Deployment Considerations

**Suitable platforms:**
- Heroku (free tier works)
- Railway
- Fly.io
- Any VPS with Node.js

**Environment variables needed:**
```
OPENAI_API_KEY=sk-...
PORT=3000
```

**Scaling:**
- Horizontal scaling: ✅ Stateless, can run multiple instances
- Load balancer: Not needed unless >1000 concurrent users

**Monitoring needs:**
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- API usage tracking (OpenAI dashboard)

## Future Enhancements

**If extending this variant:**

1. **Add conversation history:**
   - Store last N messages in browser localStorage
   - Send conversation context with each request

2. **Add FAQ search:**
   - Semantic search over FAQ before LLM call
   - Only call LLM if FAQ doesn't match

3. **Add streaming:**
   - Use OpenAI's streaming API
   - Display response word-by-word

4. **Add feedback:**
   - Thumbs up/down buttons
   - Store feedback to improve FAQs

**When to move to Variant B instead:**
- Need to extract structured data (order ID, email, etc.)
- Need to validate response format
- Need to classify user intent

**When to move to Variant C instead:**
- Need to execute actions (create ticket, look up order)
- Need conversation state management
- Need multi-step reasoning

## Research Contribution

**This variant demonstrates:**

1. **Minimal architecture induced by prompting:** Simple FAQ injection → simple architecture
2. **No validation needed:** GPT-4o-mini follows instructions reliably enough
3. **Stateless viability:** For FAQ use case, stateless is sufficient
4. **Cost-effectiveness:** $0.0001/request = viable for high volume

**Contrast with Variants B and C:**
- Adding structured output (B) requires validation layer
- Adding tool use (C) requires state management and orchestration

**Paper insight:** The prompt design (simple FAQ context) naturally leads to this minimal architecture. More complex prompts (structured output, tool use) force more complex architectures.

## License

MIT
