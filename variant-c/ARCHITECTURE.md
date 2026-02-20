# Variant C Architecture

## Overview

Variant C implements a **tool-using agent pattern** where an LLM (OpenAI GPT-4o-mini) autonomously decides which tools to call based on conversation context. This represents the most sophisticated architectural pattern among the three variants.

## Architectural Pattern: Tool-Using Agent

### Core Concept

The agent operates in an **agentic loop**:

1. Receive user message
2. Send message + conversation history to LLM
3. LLM decides whether to call tools or respond directly
4. If tools are called, execute them and return results to LLM
5. LLM processes tool results and generates final response
6. Repeat until LLM provides a final answer (no more tool calls)

This pattern enables **autonomous decision-making** - the agent decides what information it needs and how to obtain it.

### Agent Loop Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT LOOP                               │
│                                                              │
│  User Message                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │  Send to OpenAI with:                │                  │
│  │  - Conversation history              │                  │
│  │  - Tool definitions                  │                  │
│  │  - System prompt                     │                  │
│  └──────────────┬───────────────────────┘                  │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────┐                  │
│  │  LLM Decision Point                  │                  │
│  │  - Call tool(s)?                     │                  │
│  │  - Or respond directly?              │                  │
│  └──────────────┬───────────────────────┘                  │
│                 │                                           │
│        ┌────────┴────────┐                                 │
│        │                 │                                 │
│        ▼                 ▼                                 │
│  ┌───────────┐    ┌─────────────┐                         │
│  │ Tool Call │    │   Direct    │                         │
│  │           │    │  Response   │                         │
│  └─────┬─────┘    └──────┬──────┘                         │
│        │                 │                                 │
│        ▼                 │                                 │
│  ┌───────────────────┐   │                                 │
│  │ Execute Tool(s):  │   │                                 │
│  │ - search_kb       │   │                                 │
│  │ - get_account     │   │                                 │
│  │ - escalate_human  │   │                                 │
│  └─────┬─────────────┘   │                                 │
│        │                 │                                 │
│        ▼                 │                                 │
│  ┌───────────────────┐   │                                 │
│  │ Return Results to │   │                                 │
│  │ LLM (loop back)   │   │                                 │
│  └─────┬─────────────┘   │                                 │
│        │                 │                                 │
│        └────────┬────────┘                                 │
│                 │                                           │
│                 ▼                                           │
│       ┌──────────────────┐                                 │
│       │  Final Response  │                                 │
│       └──────────────────┘                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Web UI (index.html)                      │  │
│  │  - Chat interface                                     │  │
│  │  - Message display                                    │  │
│  │  - Tool usage indicators                              │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/JSON
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  EXPRESS SERVER (server.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API Endpoints                        │  │
│  │  POST /api/chat - Main chat endpoint                 │  │
│  │  GET  /api/conversation/:id - Get history           │  │
│  │  GET  /api/conversations - List all                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Agent Orchestrator (agent.js)            │  │
│  │  - Manages conversation loop                          │  │
│  │  - Coordinates tool execution                         │  │
│  │  - Handles OpenAI communication                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Tool Registry                      │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  search_kb  │  │ get_account  │  │  escalate   │ │  │
│  │  │             │  │              │  │  _to_human  │ │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Conversation Store (conversationStore.js)     │  │
│  │  - Persists conversation history                      │  │
│  │  - Manages SQLite database                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   OpenAI     │  │   SQLite     │  │    Tools     │
  │  GPT-4o-mini │  │   Database   │  │ (Knowledge   │
  │              │  │              │  │  Base, etc)  │
  └──────────────┘  └──────────────┘  └──────────────┘
```

### File Structure

```
variant-c/
├── src/
│   ├── server.js              # Express server + API endpoints
│   ├── agent.js               # Agent orchestration logic
│   ├── tools/
│   │   ├── searchKb.js        # Knowledge base search tool
│   │   ├── getAccount.js      # Account lookup tool
│   │   └── escalateToHuman.js # Escalation tool
│   └── state/
│       └── conversationStore.js # SQLite-based state management
├── public/
│   └── index.html             # Web UI
├── package.json
├── .env.example
└── README.md
```

## Key Architectural Decisions

### 1. Tool Definitions (OpenAI Function Calling)

Tools are defined as **JSON Schema** objects that the LLM understands:

```javascript
{
  type: "function",
  function: {
    name: "search_kb",
    description: "Search the knowledge base for information...",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        }
      },
      required: ["query"]
    }
  }
}
```

**Why this matters:**
- The LLM uses the `description` to decide when to call the tool
- The `parameters` schema ensures type safety
- This is a declarative interface - we describe WHAT the tool does, not HOW to use it

### 2. Server-Side State (SQLite)

Unlike Variant A (client-side state) and Variant B (stateless), Variant C uses **server-side persistence**:

```javascript
// SQLite tables
conversations {
  id TEXT PRIMARY KEY,
  created_at INTEGER,
  updated_at INTEGER
}

messages {
  id INTEGER PRIMARY KEY,
  conversation_id TEXT,
  role TEXT,
  content TEXT,
  tool_calls TEXT,      // Stores tool call metadata
  tool_call_id TEXT,
  created_at INTEGER
}
```

**Why server-side state?**
- **Multi-tool sequences**: Agent may call multiple tools before responding
- **Conversation continuity**: User can resume conversations across sessions
- **Audit trail**: Full record of tool usage and decisions
- **Context preservation**: Tool results remain in conversation history

### 3. Message Roles

The conversation uses four message roles:

| Role | Description | Example |
|------|-------------|---------|
| `system` | Agent instructions | "You are a helpful customer service assistant..." |
| `user` | Customer messages | "What is your return policy?" |
| `assistant` | Agent responses + tool calls | "Let me search our knowledge base..." |
| `tool` | Tool execution results | "RETURN POLICY: Our return policy allows..." |

**The flow:**
1. `user` → "What's your return policy?"
2. `assistant` → `tool_calls: [{ name: "search_kb", arguments: { query: "return policy" } }]`
3. `tool` → "RETURN POLICY: Our return policy allows returns within 30 days..."
4. `assistant` → "Our return policy allows returns within 30 days of purchase..."

### 4. Tool Execution in the Agent Loop

The agent loop handles **iterative tool calling**:

```javascript
while (iterations < maxIterations) {
  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: conversationMessages,
    tools: tools,
    tool_choice: 'auto'  // LLM decides
  });

  const assistantMessage = response.choices[0].message;

  // Check if LLM wants to call tools
  if (assistantMessage.tool_calls) {
    // Execute each tool
    for (const toolCall of assistantMessage.tool_calls) {
      const result = executeToolFunction(toolCall);

      // Add result to conversation
      conversationMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }

    // Loop back to LLM with tool results
    continue;
  }

  // No more tool calls - return final response
  return assistantMessage.content;
}
```

**Why a loop?**
- Agent might need **multiple tools** in sequence (e.g., get_account → search_kb)
- Agent might need **multiple iterations** to reason about tool results
- Prevents infinite loops with `maxIterations` safety check

## Tool Design Patterns

### 1. Search Tool (search_kb)

**Pattern:** Information Retrieval

```javascript
function searchKb(query) {
  // Simple keyword matching against knowledge base
  const results = knowledgeBase.filter(entry =>
    entry.keywords.some(keyword => query.includes(keyword))
  );

  return formatResults(results);
}
```

**Prompt Engineering:**
- Description emphasizes WHEN to use it ("when the customer asks about...")
- Returns formatted text (not raw data) for LLM to interpret

### 2. Lookup Tool (get_account)

**Pattern:** Data Retrieval

```javascript
function getAccount(identifier) {
  // Lookup by ID or email
  const account = database.find(acc =>
    acc.id === identifier || acc.email === identifier
  );

  return formatAccount(account);
}
```

**Design choice:** Returns structured but readable text (not JSON) so LLM can present it naturally.

### 3. Action Tool (escalate_to_human)

**Pattern:** Side Effect

```javascript
function escalateToHuman(reason) {
  // Create support ticket (in real system)
  const ticketId = createTicket(reason);

  return `Escalated to human support. Ticket: ${ticketId}`;
}
```

**Critical:** This tool has **side effects** (creates a ticket). The description guides the LLM to use it only when appropriate.

## Comparison to Other Variants

### Architectural Complexity

| Aspect | Variant A | Variant B | Variant C |
|--------|-----------|-----------|-----------|
| **Prompt Type** | Simple system prompt | JSON Schema | Tool definitions |
| **Execution Model** | Single LLM call | Single LLM call | Multi-turn loop |
| **State Management** | Client-side (JS) | Stateless | Server-side (SQLite) |
| **Validation** | None | Zod schemas | Tool schemas |
| **Error Recovery** | None | Retry with backoff | Loop + max iterations |
| **Extensibility** | Add to knowledge base | Add to schema | Add new tools |

### Prompt → Architecture Coupling

**Variant A:** Minimal coupling
- Change prompt → No architectural impact
- Add FAQ → Update JSON file

**Variant B:** Medium coupling
- Change output schema → Update Zod validator
- Add new field → Update parsing logic

**Variant C:** High coupling
- Add new capability → Create new tool + execution logic
- Change tool behavior → Update agent loop
- New tool requires: function definition + execution handler + state management

### When to Use Each Pattern

| Use Case | Recommended Variant |
|----------|---------------------|
| Simple FAQ bot | Variant A |
| Structured data extraction | Variant B |
| Multi-step workflows | Variant C |
| Needs to call external APIs | Variant C |
| Needs decision-making | Variant C |
| Budget-conscious (API costs) | Variant A or B |
| Enterprise with complex workflows | Variant C |

## Scalability Considerations

### Current Implementation

- **SQLite** for state (single-file database)
- **In-memory** tool registry
- **Synchronous** tool execution
- **Single-threaded** Node.js

### Production Considerations

For scale, you would need:

1. **Database Migration**
   - SQLite → PostgreSQL/MySQL
   - Add connection pooling
   - Implement read replicas

2. **Async Tool Execution**
   - Tools might call external APIs
   - Use `Promise.all()` for parallel tool calls
   - Implement timeouts and retries

3. **Caching**
   - Cache knowledge base searches
   - Cache account lookups (with TTL)
   - Reduce LLM API calls

4. **Rate Limiting**
   - Per-user rate limits
   - Tool execution quotas
   - OpenAI API quota management

5. **Monitoring**
   - Track tool usage patterns
   - Monitor agent loop iterations
   - Alert on infinite loops or errors

## Security Considerations

### Tool Access Control

**Current:** All tools available to all users

**Production:**
- Role-based tool access (e.g., only admins can access certain tools)
- User authentication before account lookups
- Audit logging of all tool executions

### Input Validation

Tools validate inputs:

```javascript
function getAccount(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return "Invalid identifier";
  }
  // Proceed with lookup
}
```

**Why:** Even though LLM provides the input, we still validate for safety.

### Data Sanitization

**Risk:** LLM might return sensitive data in responses

**Mitigation:**
- Filter PII before returning from tools
- Redact sensitive fields (last 4 digits of payment cards, etc.)
- Implement data access policies

## Cost Implications

### Token Usage

Variant C uses **significantly more tokens** than A or B:

1. **System prompt** (every call)
2. **Conversation history** (grows over time)
3. **Tool definitions** (every call)
4. **Tool call messages** (each tool use adds 2+ messages)
5. **Multiple iterations** (agent loop)

**Example:**
- User: "Check my account for john@example.com and tell me your return policy"
- Iteration 1: User message → Tool call (get_account)
- Iteration 2: Tool result → Tool call (search_kb)
- Iteration 3: Tool result → Final response

**Total:** 3 LLM calls vs. 1 for Variant A/B

### Cost Optimization Strategies

1. **Conversation Pruning**
   - Keep only last N messages
   - Summarize old context

2. **Smart Tool Selection**
   - Train LLM to minimize tool calls
   - Use cheaper model (GPT-3.5) for tool decision, expensive model (GPT-4) for response

3. **Caching**
   - Cache identical tool calls
   - Cache conversation embeddings

## Future Extensions

### Potential New Tools

- `create_order` - Place orders on behalf of customer
- `track_shipment` - Real-time package tracking
- `apply_discount` - Validate and apply promo codes
- `schedule_callback` - Book appointment with support
- `cancel_order` - Process cancellations

### Advanced Patterns

1. **Tool Chaining**
   - Agent learns to chain tools automatically
   - Example: get_account → check_eligibility → apply_refund

2. **Conditional Tool Access**
   - Tools available based on conversation state
   - Example: `refund_order` only after `get_account` verifies identity

3. **Human-in-the-Loop**
   - Agent proposes action, waits for human approval
   - Example: "I can process this refund. Approve? [Yes/No]"

4. **Multi-Agent Orchestration**
   - Specialist agents for different domains
   - Router agent decides which specialist to invoke

## Lessons for Research Paper

This variant demonstrates:

1. **Prompt Complexity → Architectural Complexity**
   - Tool definitions require entire execution framework
   - Simple prompt change (add tool) requires code changes

2. **State Management Requirements**
   - Tool-using agents need conversation history
   - Stateless design is insufficient

3. **Cost vs. Capability Tradeoff**
   - More powerful pattern = higher API costs
   - Token usage grows with conversation length

4. **Testing Challenges**
   - Non-deterministic tool selection
   - Hard to predict agent behavior
   - Need comprehensive tool coverage tests

5. **Vibe Coding Implications**
   - "Just add a tool" sounds simple
   - Reality: new tool = new execution path, state management, error handling
   - Architecture emerges from prompt design choices

## Conclusion

Variant C represents the **most sophisticated prompt-architecture coupling** in this experiment. The decision to use tool-calling (a prompt design choice) necessitates:

- Agent loop architecture
- Server-side state management
- Tool execution framework
- Multi-turn conversation handling
- Complex error recovery

This validates the paper's thesis: **prompt design decisions drive architectural decisions** in AI-powered systems.
