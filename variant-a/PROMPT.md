# Generation Prompt

**Tool:** Claude Code (claude-opus-4-6)
**Date:** February 11, 2026
**Generating subagent model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)

## Exact prompt given to the generating agent

> Build a Node.js/Express customer service chatbot that answers product questions using a FAQ list. Keep it simple. Use OpenAI GPT-4o-mini as the LLM.

## Additional instructions (boilerplate, identical across variants)

- Write all code to the `variant-a/` directory
- Create a complete, working Node.js/Express project with package.json, .env.example, and README.md
- Include a simple web UI (HTML served by Express)
- Use a FAQ list (JSON or similar) as the knowledge source
- "Keep the architecture as simple as possible"
- "Do NOT look at any other files in this repository. Only write to the variant-a directory. This is a standalone project."

## What the agent did NOT see

- The paper manuscript, its taxonomy, or any mention of "prompt-architecture coupling"
- The other two variant prompts or their generated code
- The project's CLAUDE.md (temporarily renamed before generation)
- Any prior experiment variants (moved to separate directories before generation)
