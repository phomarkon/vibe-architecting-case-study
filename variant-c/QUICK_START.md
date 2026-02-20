# Quick Start Guide - Variant C

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd /Users/phongsakonkonrad/labs/sagai-short/experiment/variant-c
npm install
```

Expected output:
```
added 50 packages in 5s
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# You can use nano, vim, or any text editor
nano .env
```

Add your key:
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
PORT=3000
```

**Where to get API key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### Step 3: Start the Server

```bash
npm run dev
```

Expected output:
```
============================================================
🤖 Variant C: Tool-Using Agent Chatbot
============================================================
✓ Server running on http://localhost:3000
✓ Using OpenAI GPT-4o-mini with function calling
✓ SQLite database for conversation state

Available endpoints:
  POST   http://localhost:3000/api/chat
  GET    http://localhost:3000/api/conversation/:id
  GET    http://localhost:3000/api/conversations
  GET    http://localhost:3000/api/health

============================================================
```

### Step 4: Open in Browser

Open http://localhost:3000 in your web browser.

You should see a purple gradient chat interface.

### Step 5: Test the Agent

Try these example messages:

1. **Knowledge Base Search:**
   ```
   What is your return policy?
   ```
   → Agent will call `search_kb` tool

2. **Account Lookup:**
   ```
   Check my account for john.doe@example.com
   ```
   → Agent will call `get_account` tool

3. **Multi-Tool:**
   ```
   I'm bob.wilson@example.com and want to know about shipping
   ```
   → Agent will call both `get_account` and `search_kb`

4. **Escalation:**
   ```
   I need a refund for a damaged product
   ```
   → Agent will call `escalate_to_human`

## Troubleshooting

### "Cannot find module 'openai'"

**Solution:** Run `npm install`

### "Invalid API key"

**Solution:**
1. Check `.env` file exists
2. Verify API key starts with `sk-`
3. Ensure no extra spaces in .env file

### "Port 3000 already in use"

**Solution:**
Change port in `.env`:
```env
PORT=3001
```

### Database errors

**Solution:**
Delete `conversations.db` and restart server:
```bash
rm conversations.db
npm run dev
```

## Quick Test with curl

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'
```

## File Locations

- **Server logs:** Console output
- **Database:** `conversations.db` (auto-created)
- **Web UI:** `public/index.html`
- **Configuration:** `.env`

## Next Steps

1. ✅ Server running
2. ✅ Test basic queries
3. ✅ Check tool usage in console logs
4. ✅ Try multi-tool conversations
5. ✅ Review conversation history via API

See `test-examples.md` for more test scenarios.

## Development Mode vs Production

**Development (auto-reload):**
```bash
npm run dev
```
Changes to files trigger server restart.

**Production:**
```bash
npm start
```
Server runs without file watching.

## Stopping the Server

Press `Ctrl+C` in the terminal.

## Getting Help

1. Check `README.md` for detailed documentation
2. Review `ARCHITECTURE.md` for technical details
3. See `test-examples.md` for usage examples
4. Check console logs for error messages

## System Requirements

- Node.js 18+ (for `--watch` flag)
- OpenAI API key with GPT-4o-mini access
- ~50MB disk space for dependencies
- Internet connection for OpenAI API calls

## Verification Checklist

- [ ] Dependencies installed
- [ ] `.env` file created with API key
- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] Agent responds
- [ ] Tools are called (check console logs)
- [ ] Conversation persists

## Success!

If you can send a message and get a response with tool usage indicators, you're all set!

Example successful interaction:
```
You: What is your return policy?

Agent: Our return policy allows returns within 30 days of purchase
for a full refund. Items must be unused and in original packaging.
Please keep your receipt for faster processing.

Tools used: search_kb
```

---

**You're ready to use Variant C!** 🎉

For research purposes, see `ARCHITECTURE.md` for detailed technical analysis.
