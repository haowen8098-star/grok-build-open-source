# Grok Build Open Source

An unofficial, source-backed guide to the open-source Grok Build coding agent and CLI.

## Local development

1. Install dependencies with pnpm.
2. Copy .env.example to .env.local and add an OpenRouter API key.
3. Run pnpm dev.
4. Open http://localhost:3001.

## Checks

- pnpm typecheck
- pnpm lint
- pnpm build

The Grok Console uses server-side API routes for the OpenRouter model catalog and streaming chat. The provider key must remain in .env.local. Conversation history is stored in the browser; authentication, billing, and a database are not included.

## Pricing prototype

- `/pricing` contains one free tier and three one-time demo credit packs.
- Grok Build 0.1 is the default basic model with three free successful questions.
- Advanced xAI models require a positive demo credit balance.
- Retail usage is calculated at 2x the live OpenRouter input and output rates; one credit represents $0.001.
- Quotas, balances, and pack activation use localStorage for front-end testing only. They are not secure billing or entitlement enforcement.
