# Variant B: Architecture Documentation

## System Overview

Variant B demonstrates **prompt-driven architecture** through the use of structured output constraints. The prompt design directly influences architectural decisions around validation, retry logic, and data flow.

## Architectural Pattern: Structured Output with Validation Layer

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  User Input  │────────▶│  Display UI  │                 │
│  │  (Free Text) │         │  (Metadata)  │                 │
│  └──────────────┘         └──────────────┘                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP POST /api/chat
                            │ { message, conversationId }
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Server (Node.js)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Request Validation (Zod)                               │ │
│  │  - Message length (1-500 chars)                        │ │
│  │  - Schema compliance                                   │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ LLM Service (llm.js)                                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ System Prompt                                     │ │ │
│  │  │  • Define output schema                           │ │ │
│  │  │  • Specify intent categories                      │ │ │
│  │  │  • Extraction rules                               │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                     │                                  │ │
│  │                     ▼                                  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ OpenAI GPT-4o-mini                               │ │ │
│  │  │  • response_format: { type: "json_object" }      │ │ │
│  │  │  • temperature: 0.7                               │ │ │
│  │  │  • max_tokens: 500                                │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                     │                                  │ │
│  │                     ▼                                  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Validation Layer (Zod)                           │ │ │
│  │  │                                                   │ │ │
│  │  │  ChatResponseSchema.parse(llmOutput)             │ │ │
│  │  │                                                   │ │ │
│  │  │  Valid? ──Yes──▶ Return structured response      │ │ │
│  │  │    │                                              │ │ │
│  │  │    No (ZodError)                                 │ │ │
│  │  │    │                                              │ │ │
│  │  │    ▼                                              │ │ │
│  │  │  ┌────────────────────────────┐                  │ │ │
│  │  │  │ Retry Logic                │                  │ │ │
│  │  │  │  • Attempt 1: Delay 1s     │                  │ │ │
│  │  │  │  • Attempt 2: Delay 2s     │                  │ │ │
│  │  │  │  • Attempt 3: Delay 4s     │                  │ │ │
│  │  │  │  • Max retries: 3          │                  │ │ │
│  │  │  └────────────────────────────┘                  │ │ │
│  │  │           │                                       │ │ │
│  │  │           ▼                                       │ │ │
│  │  │  All attempts failed?                            │ │ │
│  │  │     ─Yes──▶ Return fallback response             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Response Enrichment                                    │ │
│  │  • Add conversationId                                  │ │
│  │  • Add timestamp                                       │ │
│  │  • Add model metadata                                  │ │
│  │  • Add attempt count                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ JSON Response
                            │ { success: true, data: {...} }
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client Renders Result                     │
│  • Display response text                                     │
│  • Show intent and confidence                                │
│  • Display extracted entities                                │
│  • Show escalation status                                    │
└─────────────────────────────────────────────────────────────┘
```

## Prompt-Architecture Coupling

### Coupling Pattern: 1A - Structured Output Constraint

The **system prompt** enforces a rigid output schema, which in turn drives the need for:

1. **Validation Layer**: Zod schemas to verify LLM adherence
2. **Retry Infrastructure**: Exponential backoff to recover from validation failures
3. **Fallback Mechanism**: Safe degradation when validation fails repeatedly

**Key Insight**: The prompt's demand for structured JSON **forces** architectural decisions around validation and error recovery that wouldn't exist in a free-form system (Variant A).

## Data Flow

### Happy Path

```
User Message
    ↓
Request Validation (Zod)
    ↓
System Prompt Injection
    ↓
OpenAI API Call (JSON mode)
    ↓
Parse JSON Response
    ↓
Validate with Zod Schema ✓
    ↓
Enrich Metadata
    ↓
Return to Client
```

### Validation Failure Path

```
OpenAI Returns: { "intent": "xyz", "response": "..." } // Missing fields
    ↓
Zod Validation: FAIL (missing 'confidence' field)
    ↓
Log Error
    ↓
Wait 1s (exponential backoff)
    ↓
Retry #2: Call OpenAI Again
    ↓
Zod Validation: SUCCESS ✓
    ↓
Return Valid Response
```

### Complete Failure Path

```
Attempt 1: FAIL (invalid JSON)
    ↓ Wait 1s
Attempt 2: FAIL (missing fields)
    ↓ Wait 2s
Attempt 3: FAIL (wrong data types)
    ↓
All retries exhausted
    ↓
Return Fallback Response:
{
  "intent": "unknown",
  "confidence": 0.0,
  "response": "I'm having trouble. Please contact support.",
  "requiresHuman": true,
  "error": "Validation failed after 3 attempts"
}
```

## Component Descriptions

### 1. Schema Definition (`src/schema.js`)

**Purpose**: Define and validate data structures

**Key Exports**:
- `ChatResponseSchema`: Zod schema for LLM output
- `ChatRequestSchema`: Zod schema for incoming requests
- `validateChatRequest()`: Request validator
- `validateChatResponse()`: Response validator

**Architectural Impact**:
- Provides **compile-time** (via JSDoc) and **runtime** type safety
- Acts as single source of truth for data contracts
- Enables early detection of schema drift

### 2. LLM Service (`src/llm.js`)

**Purpose**: Orchestrate OpenAI API calls with retry logic

**Key Functions**:
- `analyzeMessage()`: Main analysis function with retries
- `createFallbackResponse()`: Safe degradation
- `healthCheck()`: OpenAI connectivity test

**Architectural Decisions**:
- **Stateless**: No conversation history stored server-side
- **Retry logic**: Exponential backoff (1s, 2s, 4s)
- **Error isolation**: API errors don't crash the service
- **Failover**: Graceful degradation to fallback response

**Configuration**:
```javascript
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 1000ms
MODEL = 'gpt-4o-mini'
RESPONSE_FORMAT = 'json_object'
```

### 3. Express Server (`src/server.js`)

**Purpose**: HTTP interface and routing

**Routes**:
- `POST /api/chat`: Main chatbot endpoint
- `GET /api/health`: Service health check
- `GET /`: Serve web UI

**Error Handling**:
- Zod validation errors → 400 Bad Request
- OpenAI API errors → 500 Internal Server Error
- Generic errors → 500 with logged details

**Middleware**:
- JSON body parsing
- Static file serving
- Request logging
- Global error handler

### 4. Web UI (`public/index.html`)

**Purpose**: User interface with metadata visualization

**Features**:
- Real-time message display
- Intent and confidence visualization
- Entity extraction display
- Escalation status indicators
- Loading states
- Error handling

**State Management**:
- Conversation ID tracked in JavaScript
- No server-side session required
- Messages rendered client-side

## System Prompt Design

The system prompt is the **architectural keystone** of Variant B:

```
You are a helpful customer service assistant...

Always respond with valid JSON matching this structure:
{
  "intent": "order_status" | "return_request" | ...,
  "confidence": 0.0 to 1.0,
  "entities": { ... },
  "response": "...",
  "requiresHuman": boolean,
  "suggestedActions": [...]
}
```

**Impact on Architecture**:

1. **Forces JSON mode**: `response_format: { type: "json_object" }`
2. **Requires validation**: Cannot trust LLM to follow schema perfectly
3. **Necessitates retry logic**: Validation failures need recovery
4. **Enables typed responses**: Client knows exact structure to expect

## Validation Strategy

### Two-Layer Validation

**Layer 1: Request Validation**
- Validates incoming user messages
- Checks message length (1-500 chars)
- Ensures conversationId format (if provided)
- **Fail-fast**: Rejects invalid requests immediately

**Layer 2: Response Validation**
- Validates LLM output structure
- Checks all required fields present
- Validates data types and ranges
- **Fail-retry**: Retries on validation failure

### Why Zod?

Alternatives considered:

| Library | Pros | Cons |
|---------|------|------|
| **Zod** ✓ | Type inference, detailed errors, composable | Slightly verbose |
| Joi | Mature, feature-rich | No TypeScript inference |
| JSON Schema | Standard, language-agnostic | Requires separate validator |
| Yup | Popular, simple API | Less type-safe |

**Decision**: Zod chosen for TypeScript-like type inference and detailed error messages.

## Retry Logic Design

### Exponential Backoff

```
Attempt 1: Immediate
Attempt 2: Wait 1s (2^0 × 1000ms)
Attempt 3: Wait 2s (2^1 × 1000ms)
Attempt 4: Wait 4s (2^2 × 1000ms) // Not reached (MAX_RETRIES=3)
```

**Rationale**:
- **Immediate first attempt**: Fast response on success
- **Increasing delays**: Give LLM/API time to recover
- **Max 3 retries**: Balance reliability vs latency

### When NOT to Retry

```javascript
// Don't retry on:
if (error.code === 'invalid_api_key') throw error;  // Config error
if (error.status === 429) throw error;              // Rate limit
```

**Rationale**: These errors won't resolve with retries.

## Error Handling Philosophy

### Graceful Degradation

```
Preferred: Valid structured response
    ↓ (validation failure)
Acceptable: Retry with backoff
    ↓ (all retries failed)
Fallback: Safe error response with requiresHuman=true
    ↓ (never)
Unacceptable: Crash or expose raw error to user
```

### Error Transparency

- **To developers**: Log full error details
- **To users**: Show friendly message, hide technical details
- **To monitoring**: Track failure rates and retry distribution

## Scalability Considerations

### Stateless Architecture

**Benefits**:
- Horizontal scaling (no session affinity needed)
- Simple deployment (no Redis/session store)
- Crash resilience (no in-memory state loss)

**Trade-offs**:
- No server-side conversation history
- ConversationId managed client-side
- Cannot implement multi-turn context without database

### Performance Profile

**Latency**:
- P50: ~800ms (single OpenAI API call)
- P90: ~1.5s (includes occasional retry)
- P99: ~5s (multiple retries with backoff)

**Throughput**:
- Limited by OpenAI API rate limits
- ~100 requests/minute (free tier)
- ~3,000 requests/minute (paid tier)

**Cost**:
- ~$0.0002 per message (GPT-4o-mini pricing)
- ~$0.20 per 1,000 messages

## Security Considerations

### API Key Protection

- Stored in environment variable
- Never exposed to client
- Validated on server startup

### Input Validation

- Message length limits (1-500 chars)
- Schema validation on all inputs
- No SQL injection risk (stateless, no DB)

### Output Sanitization

- LLM responses rendered as text (not HTML)
- XSS protection via escapeHtml() in UI
- No user-generated content stored

## Testing Strategy

### Unit Tests

```javascript
// Schema validation
test('valid response passes schema', () => {
  const valid = { intent: 'order_status', confidence: 0.9, ... };
  expect(() => ChatResponseSchema.parse(valid)).not.toThrow();
});

// Retry logic
test('retries on validation failure', async () => {
  // Mock OpenAI to return invalid JSON first, then valid
  // Assert: 2 attempts made
});
```

### Integration Tests

```javascript
// API endpoint
test('POST /api/chat returns structured response', async () => {
  const response = await request(app)
    .post('/api/chat')
    .send({ message: 'Where is my order?' });

  expect(response.status).toBe(200);
  expect(response.body.data.intent).toBeDefined();
});
```

### E2E Tests

- Manual testing with UI
- Test all intent types
- Verify metadata display
- Check error states

## Monitoring Recommendations

### Key Metrics

1. **Validation Failure Rate**: `failures / total_requests`
   - Target: <5%
   - Alert: >10%

2. **Retry Distribution**: `attempts_1 : attempts_2 : attempts_3`
   - Expected: 95:4:1
   - Alert: attempts_3 > 5%

3. **Intent Distribution**: Track most common intents
   - Informs business priorities
   - Identifies missing intent categories

4. **Escalation Rate**: `requiresHuman=true / total_requests`
   - Baseline: 10-20%
   - Alert: >30% (possible prompt issue)

5. **Confidence Scores**: Average per intent type
   - Track drift over time
   - Low confidence may indicate new customer language

### Logging Strategy

```javascript
// Structured logs
console.log(`[Chat] Intent: ${intent}, Confidence: ${confidence}, Attempt: ${attempt}`);

// Error logs
console.error(`[LLM] Validation failed: ${error.message}`);

// Performance logs
console.log(`[API] Request processed in ${duration}ms`);
```

## Future Enhancements

### Considered but Not Implemented

1. **Conversation Memory**
   - Add database (PostgreSQL/SQLite)
   - Store message history
   - Enable context-aware responses
   - **Trade-off**: Increased complexity, state management

2. **Streaming Responses**
   - Use OpenAI streaming API
   - Display response as it's generated
   - **Trade-off**: Cannot validate until complete

3. **Intent-Specific Handlers**
   - Route by intent to specialized services
   - Example: `order_status` → query order database
   - **Trade-off**: Requires additional services

4. **A/B Testing**
   - Test different prompts
   - Compare confidence scores
   - **Trade-off**: Needs analytics infrastructure

## Comparison with Variant A

| Aspect | Variant A (Free-form) | Variant B (Structured) |
|--------|----------------------|----------------------|
| Prompt | Simple FAQ context injection | Detailed schema specification |
| LLM Output | Plain text | Structured JSON |
| Validation | None | Zod schema with retries |
| Architecture | Minimal (stateless) | Validation layer + retry logic |
| Complexity | Low | Medium |
| Error Recovery | None | Exponential backoff |
| Type Safety | None | Runtime + static typing |
| Extensibility | Limited | High (intent-based routing) |

**Key Takeaway**: The prompt's demand for structured output **drives** architectural complexity. This is the core research insight for the paper.

## License

MIT
