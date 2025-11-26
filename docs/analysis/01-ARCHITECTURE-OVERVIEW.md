# BPAY Agent - Architecture Overview

## Executive Summary

The BPAY Agent is a conversational AI assistant built for Australian bill payments (BPAY). It leverages **LangChain.js** and **LangGraph** to create a stateful, tool-calling agent that can process bill payments through natural language interaction.

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Node.js | ES2022 | JavaScript runtime |
| Language | TypeScript | ^5.5.0 | Type safety |
| Module System | ES Modules | NodeNext | Modern imports |
| AI Framework | LangChain.js | ^0.3.0 | LLM orchestration |
| State Machine | LangGraph | ^0.2.0 | Agentic workflows |
| LLM Provider | OpenAI-compatible | - | Local proxy expected |
| Schema Validation | Zod | ^3.23.0 | Runtime validation |
| Config Management | dotenv | ^16.4.0 | Environment variables |

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Interface                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                          CLI Layer                            │  │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  ReadLine   │  │ StreamingOutput │  │     Colors      │   │  │
│  │  │  Interface  │  │                 │  │                 │   │  │
│  │  └─────────────┘  └─────────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Agent Layer                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       BPAYAgent                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │                    LangGraph StateGraph                  │ │  │
│  │  │  ┌──────────┐       ┌──────────────┐       ┌─────────┐  │ │  │
│  │  │  │  START   │──────▶│  Agent Node  │──────▶│  END    │  │ │  │
│  │  │  │          │       │   (LLM)      │       │         │  │ │  │
│  │  │  └──────────┘       └──────┬───────┘       └─────────┘  │ │  │
│  │  │                            │                     ▲       │ │  │
│  │  │                    (has tool calls?)             │       │ │  │
│  │  │                            │                     │       │ │  │
│  │  │                            ▼                     │       │ │  │
│  │  │                    ┌──────────────┐              │       │ │  │
│  │  │                    │  Tool Node   │──────────────┘       │ │  │
│  │  │                    │              │                      │ │  │
│  │  │                    └──────────────┘                      │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │  MemorySaver    │  │        System Prompt             │   │  │
│  │  │  (Checkpointer) │  │   (Intent classification,        │   │  │
│  │  │                 │  │    tool sequence, HITL rules)    │   │  │
│  │  └─────────────────┘  └──────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Tools Layer                                 │
│                                                                      │
│  ┌──────────┐  ┌────────────────────┐  ┌─────────────────────────┐  │
│  │ get_user │  │ get_saved_billers  │  │ validate_biller_account │  │
│  └──────────┘  └────────────────────┘  └─────────────────────────┘  │
│  ┌──────────┐  ┌─────────────────────┐                              │
│  │ pay_bill │  │ create_biller       │                              │
│  └──────────┘  └─────────────────────┘                              │
│                                                                      │
│  Each tool has:  [Schema (Zod)] + [Implementation] + [Description]  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Services Layer                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Interfaces                               │  │
│  │  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐  │  │
│  │  │IUserService │  │IBillerService │  │IPaymentService     │  │  │
│  │  └─────────────┘  └───────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                      │
│                              │ implements                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Mock Implementations                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │MockUserService  │  │MockBillerService│  │MockPayment   │  │  │
│  │  │                 │  │                 │  │Service       │  │  │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │  │
│  │                              │                                │  │
│  │                              ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐│  │
│  │  │                     Mock Data Store                       ││  │
│  │  │  users: Map<string, User>                                 ││  │
│  │  │  billerAccounts: Map<string, BillerAccount>               ││  │
│  │  │  payments: Map<string, Payment>                           ││  │
│  │  └──────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cross-Cutting Concerns                            │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │      Types       │  │      Errors      │  │      Config      │  │
│  │  User, Biller,   │  │   BPAYError,     │  │   Environment    │  │
│  │  Payment, etc.   │  │   ErrorCode      │  │   Variables      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts                    # Application entry point
├── config/
│   └── index.ts                # Environment configuration
├── agent/
│   ├── index.ts                # Agent exports
│   ├── bpay-agent.ts           # Main BPAYAgent class
│   └── prompts/
│       └── system.prompt.ts    # System prompt definition
├── tools/
│   ├── index.ts                # Tool exports
│   ├── get-user.tool.ts        # User retrieval tool
│   ├── get-saved-billers.tool.ts # Biller query tool
│   ├── validate-biller.tool.ts # Biller validation tool
│   ├── pay-bill.tool.ts        # Payment execution tool
│   ├── create-biller.tool.ts   # Biller creation tool
│   └── schemas/
│       ├── get-user.schema.ts
│       ├── get-saved-billers.schema.ts
│       ├── validate-biller.schema.ts
│       ├── pay-bill.schema.ts
│       └── create-biller.schema.ts
├── services/
│   ├── index.ts                # Service exports (DI entry point)
│   ├── interfaces/
│   │   ├── user.interface.ts
│   │   ├── biller.interface.ts
│   │   └── payment.interface.ts
│   └── mock/
│       ├── data.ts             # In-memory mock data
│       ├── user.service.ts
│       ├── biller.service.ts
│       └── payment.service.ts
├── cli/
│   ├── index.ts                # CLI class
│   ├── readline.ts             # Readline wrapper
│   ├── streaming.ts            # Stream output handler
│   └── colors.ts               # ANSI color utilities
├── types/
│   ├── index.ts                # Type exports
│   ├── user.types.ts
│   ├── biller.types.ts
│   ├── payment.types.ts
│   └── tool.types.ts
└── utils/
    └── errors.ts               # Error handling utilities
```

## Layer Responsibilities

### 1. Entry Point (`src/index.ts`)
- Validates configuration (API key check)
- Instantiates and runs the CLI
- Handles top-level errors

### 2. CLI Layer (`src/cli/`)
- **CLI class**: Main REPL loop, command handling
- **ReadlineInterface**: Promisified readline wrapper
- **StreamingOutput**: Real-time token streaming display
- **colors**: ANSI escape code utilities

### 3. Agent Layer (`src/agent/`)
- **BPAYAgent**: Core agent orchestration
  - Creates LangGraph StateGraph
  - Manages conversation state via MemorySaver
  - Handles streaming/sync message processing
- **System Prompt**: Intent classification, tool sequence rules, HITL requirements

### 4. Tools Layer (`src/tools/`)
- Five DynamicStructuredTools with Zod schemas
- Each tool wraps a service call
- Tools return JSON-stringified results

### 5. Services Layer (`src/services/`)
- Interface-based design for testability
- Mock implementations for development
- Simulated network latency
- In-memory data store

### 6. Types Layer (`src/types/`)
- Domain entities (User, BillerAccount, Payment)
- Tool result types
- Enumerations (BillerCategory, PaymentStatus)

### 7. Utils Layer (`src/utils/`)
- BPAYError class for typed errors
- Error code enumeration
- User-friendly error messages

## Data Flow

1. **User Input** enters through CLI readline
2. **CLI** passes message to BPAYAgent with thread ID and JWT
3. **BPAYAgent** invokes LangGraph with SystemPrompt + user message
4. **LLM** in agent node decides to respond or call tools
5. **Tool Node** executes selected tools via service layer
6. **Services** query/mutate mock data store
7. **Results** flow back through graph to agent node
8. **Agent** generates final response or continues tool loop
9. **CLI** streams tokens to user via StreamingOutput

## Key Architectural Patterns

1. **State Graph Pattern** (LangGraph)
   - Nodes for agent logic and tool execution
   - Conditional edges based on LLM output
   - Checkpointing for conversation persistence

2. **Dependency Injection** (Services)
   - Interface-based service design
   - Easy swap between mock/production implementations
   - Centralized service exports

3. **Schema-First Tools** (Zod)
   - Runtime input validation
   - Self-documenting API for LLM
   - Type inference for TypeScript

4. **Streaming Architecture**
   - AsyncGenerator for real-time token output
   - Event-based stream handling
   - Graceful error propagation

## Environment Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | API key for LLM provider |
| `OPENAI_MODEL` | No | `openai/gpt-oss-20b` | Model identifier |
| `MOCK_JWT_TOKEN` | No | `mock_jwt_token_001` | Default test token |
| `ENABLE_DEBUG_LOGGING` | No | `false` | Debug mode flag |

**Note**: The agent is configured to use `http://localhost:1234/v1` as the base URL, expecting a local LLM proxy (e.g., LM Studio, Ollama with OpenAI-compatible API).
