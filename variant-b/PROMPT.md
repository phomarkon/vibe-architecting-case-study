# Generation Prompt

**Tool:** Claude Code (claude-opus-4-6)
**Date:** February 11, 2026
**Generating subagent model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)

## Exact prompt given to the generating agent

> Build a Node.js/Express customer service chatbot that analyzes customer messages and returns structured JSON with intent, confidence, entities, and a response. Use schema validation for the LLM output. Use OpenAI GPT-4o-mini as the LLM.

## Additional instructions (boilerplate, identical across variants)

- Write all code to the `variant-b/` directory
- Create a complete, working Node.js/Express project with package.json, .env.example, and README.md
- Include a web UI (HTML served by Express)
- Validate the LLM output against a schema (e.g., using Zod, Joi, or JSON Schema)
- Handle validation failures gracefully (retry or fallback)
- "Do NOT look at any other files in this repository. Only write to the variant-b directory. This is a standalone project."

## What the agent did NOT see

- The paper manuscript, its taxonomy, or any mention of "prompt-architecture coupling"
- The other two variant prompts or their generated code
- The project's CLAUDE.md (temporarily renamed before generation)
- Any prior experiment variants (moved to separate directories before generation)
