# Test Examples for Variant C

This document provides example conversations to test the tool-using agent.

## Setup

1. Install dependencies: `npm install`
2. Create `.env` file with your OpenAI API key
3. Run server: `npm run dev`
4. Open http://localhost:3000 in your browser

## Test Scenarios

### 1. Knowledge Base Search

**User:** "What is your return policy?"

**Expected Behavior:**
- Agent calls `search_kb` with query "return policy"
- Returns information about 30-day returns

**Tools Used:** `search_kb`

---

**User:** "How long does shipping take?"

**Expected Behavior:**
- Agent calls `search_kb` with query "shipping"
- Returns shipping time information

**Tools Used:** `search_kb`

---

### 2. Account Lookup

**User:** "Can you check my account? My email is john.doe@example.com"

**Expected Behavior:**
- Agent calls `get_account` with identifier "john.doe@example.com"
- Returns account details for John Doe

**Tools Used:** `get_account`

---

**User:** "Look up customer ID CUST002"

**Expected Behavior:**
- Agent calls `get_account` with identifier "CUST002"
- Returns account details for Jane Smith

**Tools Used:** `get_account`

---

### 3. Multi-Tool Usage

**User:** "I'm john.doe@example.com and I want to know about your return policy"

**Expected Behavior:**
- Agent calls `get_account` to verify identity
- Agent calls `search_kb` to get return policy
- Responds with personalized information

**Tools Used:** `get_account`, `search_kb`

---

**User:** "Check my account for alice.johnson@example.com and tell me about shipping options"

**Expected Behavior:**
- Agent calls `get_account` for Alice Johnson
- Agent calls `search_kb` for shipping info
- Combines both results

**Tools Used:** `get_account`, `search_kb`

---

### 4. Escalation to Human

**User:** "I want a refund for a damaged product"

**Expected Behavior:**
- Agent recognizes this requires human intervention
- Calls `escalate_to_human` with reason
- Provides ticket ID and next steps

**Tools Used:** `escalate_to_human`

---

**User:** "I need to speak to a manager"

**Expected Behavior:**
- Agent respects explicit escalation request
- Calls `escalate_to_human`
- Confirms transfer to human agent

**Tools Used:** `escalate_to_human`

---

### 5. No Tool Needed

**User:** "Hello!"

**Expected Behavior:**
- Agent responds with greeting
- No tool calls needed

**Tools Used:** None

---

**User:** "Thank you for your help"

**Expected Behavior:**
- Agent responds politely
- No tool calls needed

**Tools Used:** None

---

### 6. Complex Multi-Turn Conversation

**Conversation:**

1. **User:** "Hi, I'm interested in your products"
   - **Agent:** Greets, no tools

2. **User:** "What's your warranty policy?"
   - **Agent:** Calls `search_kb`, provides warranty info

3. **User:** "My email is bob.wilson@example.com, can you check my account?"
   - **Agent:** Calls `get_account`, shows account details

4. **User:** "I want to return my last order"
   - **Agent:** Calls `search_kb` for return policy, then `escalate_to_human` for order-specific return

---

### 7. Edge Cases

**User:** "asdfghjkl"

**Expected Behavior:**
- Agent tries to understand
- May search knowledge base or ask for clarification
- Graceful handling

---

**User:** "Can you check account for nonexistent@example.com?"

**Expected Behavior:**
- Agent calls `get_account`
- Tool returns "No account found"
- Agent communicates this to user

---

**User:** "Search for information about quantum physics"

**Expected Behavior:**
- Agent calls `search_kb`
- No results found
- Agent suggests contacting support

---

## Testing API Directly

### Test with curl

```bash
# Test basic chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'

# Test with conversation ID
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you check my account for john.doe@example.com?",
    "conversationId": "test_conv_123"
  }'

# Get conversation history
curl http://localhost:3000/api/conversation/test_conv_123

# List all conversations
curl http://localhost:3000/api/conversations
```

### Test Response Format

Expected response structure:

```json
{
  "response": "Our return policy allows returns within 30 days of purchase...",
  "conversationId": "conv_1234567890_abc123",
  "toolsUsed": ["search_kb"]
}
```

## Expected Tool Call Logs

When running the server, you should see logs like:

```
[Agent] Starting agent loop...
[Agent] Iteration 1
[Agent] Model requested 1 tool call(s)
[Agent] Calling tool: search_kb { query: 'return policy' }
[search_kb] Searching for: "return policy"
[search_kb] Found 1 result(s)
[Agent] Tool search_kb returned result
[Agent] Iteration 2
[Agent] Agent loop complete
```

## Performance Metrics

Track these for your research:

- **Tool calls per conversation**: How many tools does the agent use?
- **Iterations per message**: How many LLM calls needed?
- **Token usage**: Significantly higher than Variant A/B
- **Response time**: Slower due to multiple API calls
- **Accuracy**: Did agent choose correct tools?

## Common Issues

1. **Agent doesn't call tools**
   - Check tool descriptions are clear
   - Verify API key is valid
   - Check model supports function calling (GPT-4o-mini does)

2. **Infinite loop**
   - Agent keeps calling tools without responding
   - Check `maxIterations` safety limit (set to 10)
   - Review tool return values

3. **Wrong tool selection**
   - Agent chooses inappropriate tool
   - Refine tool descriptions
   - Adjust system prompt

4. **Database errors**
   - SQLite file permissions
   - Check `conversations.db` is created
   - Verify `better-sqlite3` installed correctly

## Success Criteria

Variant C is working correctly if:

- ✓ Agent autonomously selects appropriate tools
- ✓ Agent can call multiple tools in sequence
- ✓ Conversation history persists across messages
- ✓ Tool usage is logged and visible in UI
- ✓ Agent provides natural responses incorporating tool results
- ✓ Escalation to human works appropriately
- ✓ Edge cases are handled gracefully

## Next Steps for Research

1. **Log Tool Usage Patterns**
   - Which tools are used most?
   - How often are multiple tools called?
   - Average iterations per conversation?

2. **Compare Variants**
   - Token usage: C vs. A vs. B
   - Response quality
   - Architectural complexity

3. **Analyze Prompt-Architecture Coupling**
   - Map each tool to architectural components
   - Document what changes when adding a new tool
   - Measure development effort vs. Variant A/B
