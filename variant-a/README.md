# Variant A: Simple FAQ Chatbot

A minimal customer service chatbot that uses OpenAI GPT-4o-mini with FAQ-based knowledge injection. This represents the simplest approach to building an AI-powered chatbot.

## Architecture Pattern

**Simple Context Injection** - FAQ data is loaded once at startup and injected into the system prompt. No structured output, no validation, no server-side state management.

## Key Characteristics

- **LLM**: OpenAI GPT-4o-mini
- **Pattern**: FAQ context injection via system prompt
- **Output**: Free-form text responses
- **Validation**: None
- **State**: Client-side only (conversation history not persisted)
- **Error Handling**: Basic try-catch with user-friendly messages

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **LLM Client**: OpenAI SDK
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Project Structure

```
variant-a/
├── server.js              # Express server setup
├── chatHandler.js         # OpenAI integration logic
├── faq.json              # FAQ knowledge base
├── public/
│   └── index.html        # Chat UI
├── package.json
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-...
PORT=3000
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Run the Server

**Production mode:**
```bash
npm start
```

**Development mode (with auto-reload):**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

1. Open your browser to `http://localhost:3000`
2. Type a question in the chat input
3. Press Enter or click Send
4. The chatbot will respond based on the FAQ knowledge base

### Example Questions

Try asking:
- "What are your business hours?"
- "How do I reset my password?"
- "What is your return policy?"
- "Do you ship internationally?"

## How It Works

### 1. FAQ Loading

At startup, `chatHandler.js` loads the FAQ data from `faq.json` and builds a context string:

```javascript
const faqData = JSON.parse(await fs.readFile('faq.json', 'utf-8'));
faqContext = faqData
  .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
  .join('\n\n');
```

### 2. System Prompt Injection

Each user message triggers a new OpenAI API call with the FAQ context in the system prompt:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `You are a helpful customer service assistant. Answer based on this FAQ:
${faqContext}`
    },
    {
      role: 'user',
      content: userMessage
    }
  ]
});
```

### 3. Response Flow

```
User types message
    ↓
Frontend sends POST to /api/chat
    ↓
Server passes message to chatHandler
    ↓
OpenAI API call with FAQ context
    ↓
Response returned to frontend
    ↓
Message displayed in chat UI
```

## Customization

### Modify the FAQ

Edit `faq.json` to add or change questions:

```json
[
  {
    "question": "Your new question?",
    "answer": "Your answer here."
  }
]
```

Restart the server to load the new FAQs.

### Adjust LLM Behavior

Edit the system prompt in `chatHandler.js`:

```javascript
content: `You are a helpful customer service assistant...`
```

Change the model parameters:

```javascript
temperature: 0.7,  // Lower = more deterministic
max_tokens: 300,   // Maximum response length
```

### Change the Port

Set `PORT` in `.env`:

```env
PORT=8080
```

## Architecture Rationale

This variant demonstrates the **simplest possible approach**:

- **No structured output**: The LLM returns free-form text
- **No validation**: We trust the LLM to follow instructions
- **No state management**: Each request is independent
- **No retry logic**: Failed requests just show an error
- **Client-side conversation**: History is only stored in the browser

This makes the code easy to understand and maintain, but has limitations:

- Response format is unpredictable
- No guarantee the LLM will stay on topic
- Can't easily extract structured data
- Conversation history lost on page refresh
- No multi-turn conversation context

**For comparison**: See Variant B (structured output) and Variant C (tool-using agent) for more sophisticated approaches.

## API Endpoints

### `POST /api/chat`

Send a message to the chatbot.

**Request:**
```json
{
  "message": "What are your business hours?"
}
```

**Response:**
```json
{
  "response": "We're open Monday through Friday, 9 AM to 6 PM EST...",
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "An error occurred processing your message. Please try again."
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T10:30:00.000Z"
}
```

## Cost Considerations

**OpenAI GPT-4o-mini pricing** (as of Feb 2024):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

Typical chat message costs:
- System prompt (FAQ): ~500 tokens
- User question: ~20 tokens
- Bot response: ~100 tokens
- **Cost per message**: ~$0.0001 (1/100th of a cent)

For 1,000 messages: ~$0.10

## Troubleshooting

**Error: "OPENAI_API_KEY environment variable is not set"**
- Make sure you created a `.env` file
- Verify the API key is correct
- Check there are no extra spaces

**Error: "Failed to generate response"**
- Check your OpenAI API key is valid
- Verify you have API credits
- Check your internet connection

**Chat UI not loading**
- Make sure the server is running (`npm start`)
- Check the correct port (default 3000)
- Look for errors in the server console

**Slow responses**
- Normal - GPT-4o-mini typically takes 1-3 seconds
- Check your internet speed
- Try reducing `max_tokens` in `chatHandler.js`

## Security Notes

- Never commit `.env` to version control
- The OpenAI API key should be kept secret
- Input validation is minimal - consider adding rate limiting for production
- No authentication - all users share the same FAQ context

## Next Steps

**To make this production-ready:**
1. Add rate limiting (express-rate-limit)
2. Add request validation (zod or joi)
3. Add conversation history persistence (database)
4. Add authentication/user sessions
5. Add monitoring (Sentry)
6. Add caching for common questions

**To explore more advanced patterns:**
- See Variant B for structured JSON output with validation
- See Variant C for tool-using agent with state management

## License

MIT
