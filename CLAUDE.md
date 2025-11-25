# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

```bash
npm start          # Run the CLI application
npm run dev        # Run with watch mode (auto-reload on changes)
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting files
```

## Environment Setup

The application requires an OpenAI API key. Create a `.env` file:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=openai/gpt-oss-20b  # optional, defaults to openai/gpt-oss-20b
MOCK_JWT_TOKEN=mock_jwt_token_001  # optional, for testing
```

Note: The ChatOpenAI is configured to use `http://localhost:1234/v1` as the base URL (see `src/agent/bpay-agent.ts:41`), indicating a local LLM proxy is expected.

## Architecture Overview

This is a BPAY (Australian bill payment) conversational agent built with LangChain.js and LangGraph.

### Core Flow
```
User Input → CLI → BPAYAgent → LangGraph StateGraph → Tools → Mock Services
```

### Key Components

**Agent Layer** (`src/agent/`)
- `BPAYAgent` class wraps a LangGraph `StateGraph` with two nodes: `agent` (LLM calls) and `tools` (tool execution)
- Uses `MemorySaver` for conversation persistence across turns
- Supports both streaming (`processMessage`) and sync (`processMessageSync`) message processing
- JWT token is passed in message context for user identification

**Tools** (`src/tools/`)
- `get_user` - Retrieve user info from JWT
- `get_saved_biller_accounts` - Query user's saved billers with optional filtering
- `validate_biller_account` - Validate biller details before payment
- `pay_bill` - Execute BPAY payment (requires prior validation)
- `create_biller` - Add new biller to user's saved billers

Each tool has a corresponding Zod schema in `src/tools/schemas/`.

**Services** (`src/services/`)
- Interface-based design in `interfaces/` for dependency injection
- Mock implementations in `mock/` with static test data in `mock/data.ts`
- To add real implementations: create new service files and update `services/index.ts` exports

**CLI** (`src/cli/`)
- `CLI` class orchestrates the REPL loop
- `StreamingOutput` handles real-time token streaming display
- `ReadlineInterface` wraps Node.js readline

### Important Patterns

1. **Tool calling sequence**: The system prompt enforces `get_user → get_saved_biller_accounts → validate_biller_account → pay_bill`

2. **Human-in-the-loop**: Payment confirmation is mandatory before `pay_bill` execution (enforced via system prompt)

3. **ESM modules**: Project uses ES modules (`"type": "module"` in package.json). All local imports require `.js` extension even for `.ts` files.
