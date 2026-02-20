# Supplementary Material: Architecture Without Architects

Case study code for the paper *"Architecture Without Architects: How AI Coding Agents Shape Software Architecture"* (SAGAI 2026, co-located with ICSA 2026).

Three customer service chatbot variants, each generated from a single prompt by an AI coding agent. Same task, same runtime LLM (GPT-4o-mini), different prompt specifications. The results: structurally different systems ranging from 141 to 827 lines of code.

| Variant | Prompt style | LoC | Files | Key pattern |
|---------|-------------|-----|-------|-------------|
| A | "answer FAQ questions" | 141 | 2 | Context injection |
| B | "return structured JSON with validation" | 472 | 4 | Pipe-and-filter (validate, retry, fallback) |
| C | "agent with tool access: search_kb(), get_account(), escalate()" | 827 | 6 | Agent loop with SQLite state |

## Running the variants

Each variant is a standalone Node.js/Express app. Requirements: Node.js 18+ and an OpenAI API key.

```bash
cd variant-a          # or variant-b, variant-c
npm install
cp .env.example .env  # then add your OPENAI_API_KEY
npm start
```

Open `http://localhost:3000` for the web UI.

## Methodology

See [METHODOLOGY.md](METHODOLOGY.md) for the full generation procedure, independence guarantees, prompts used, and threats to validity.

## License

MIT
