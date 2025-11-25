# BPAY Agent - Implementation Plan

> This document captures the complete implementation plan for the BPAY Agent project, including all technical decisions, architecture choices, and detailed specifications.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Requirements Analysis](#2-requirements-analysis)
3. [Technology Stack Selection](#3-technology-stack-selection)
4. [Architecture Design](#4-architecture-design)
5. [Project Structure](#5-project-structure)
6. [Type Definitions](#6-type-definitions)
7. [Tool Specifications](#7-tool-specifications)
8. [Agent Design](#8-agent-design)
9. [Human-in-the-Loop Strategy](#9-human-in-the-loop-strategy)
10. [Streaming Implementation](#10-streaming-implementation)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Mock Services Design](#12-mock-services-design)
13. [CLI Design](#13-cli-design)
14. [Implementation Phases](#14-implementation-phases)
15. [Dependencies](#15-dependencies)

---

## 1. Project Overview

### 1.1 Purpose
Build a conversational AI agent that handles BPAY (Australian bill payment) operations. The agent should:
- Process natural language requests for bill payments
- Perform intent classification to handle only BPAY-related queries
- Execute sequential tool calls for payment workflows
- Implement human-in-the-loop for confirmations and edge cases
- Stream responses in real-time to a CLI interface

### 1.2 Example User Flow
```
User: "I want to pay my water bill"

Agent Flow:
1. get_user(JWT token) → user_id
2. get_saved_biller_accounts(user_id, filter="water") → List[biller_account]
3. If found: validate_biller_account(billerCode, accountNumber, accountRef) → true/false
4. If validated: Ask for amount (if not provided)
5. Confirm with user: "Pay $X to Y?"
6. If confirmed: pay_bill(params) → success/failure
```

---

## 2. Requirements Analysis

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Intent classification for BPAY vs off-topic queries | High |
| FR2 | Sequential tool calling for payment workflow | High |
| FR3 | Human-in-the-loop for payment confirmation | High |
| FR4 | Human-in-the-loop when no biller found | High |
| FR5 | Real-time streaming output | High |
| FR6 | Error handling with user-friendly messages | Medium |
| FR7 | Conversation memory within session | Medium |
| FR8 | Support for adding new billers | Medium |

### 2.2 Non-Functional Requirements

| ID | Requirement | Decision |
|----|-------------|----------|
| NFR1 | Language | TypeScript |
| NFR2 | Frontend | CLI (demo purposes) |
| NFR3 | LLM Provider | OpenAI GPT |
| NFR4 | Agent Framework | LangChain.js / LangGraph |
| NFR5 | API Strategy | Mock + Interface (swappable) |
| NFR6 | State Persistence | In-memory only |
| NFR7 | Payment Confirmation | Always required (user choice) |

### 2.3 User's Decision Points

During planning, the following decisions were made by the user:

1. **LLM Provider**: OpenAI GPT (over Anthropic Claude)
2. **Framework**: LangChain.js (over Vercel AI SDK or raw SDK)
3. **API Strategy**: Mock + Interface (ready for real APIs)
4. **Persistence**: In-memory only (no database)
5. **Payment Confirmation**: Always confirm (not threshold-based)

---

## 3. Technology Stack Selection

### 3.1 Core Technologies

| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| Runtime | Node.js | 18+ | Modern ES modules support |
| Language | TypeScript | ^5.5.0 | Type safety, better DX |
| LLM | OpenAI GPT | gpt-4-turbo-preview | User preference, tool calling |
| Agent Framework | LangChain.js | ^0.3.0 | Tool calling, streaming |
| Agent Orchestration | LangGraph | ^0.2.0 | State management, graph flows |
| Schema Validation | Zod | ^3.23.0 | Runtime validation + JSON schema |
| Environment | dotenv | ^16.4.0 | Environment variable management |

### 3.2 Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.5.0 | TypeScript compiler |
| tsx | ^4.0.0 | TypeScript execution without compilation |
| @types/node | ^22.0.0 | Node.js type definitions |

### 3.3 Why LangGraph over AgentExecutor

| Feature | AgentExecutor | LangGraph |
|---------|---------------|-----------|
| State management | Basic | Full state graph |
| Human-in-the-loop | Limited | `interrupt` pattern |
| Flow control | Sequential | Conditional edges |
| Streaming | Basic | `streamEvents` API |
| Debugging | Limited | Visual graph representation |

**Decision**: LangGraph chosen for better human-in-the-loop support via `interrupt` pattern.

---

## 4. Architecture Design

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Readline   │  │  Streaming      │  │  Colors         │  │
│  │  Interface  │  │  Output         │  │  Formatting     │  │
│  └─────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Agent Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   BPAYAgent                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │    │
│  │  │  LangGraph   │  │  System      │  │  Memory   │  │    │
│  │  │  StateGraph  │  │  Prompt      │  │  Saver    │  │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Tools Layer                            │
│  ┌───────────┐ ┌────────────────┐ ┌────────────────────┐   │
│  │ get_user  │ │ get_saved_     │ │ validate_biller_   │   │
│  │           │ │ biller_accounts│ │ account            │   │
│  └───────────┘ └────────────────┘ └────────────────────┘   │
│  ┌───────────┐ ┌────────────────────┐                      │
│  │ pay_bill  │ │ create_biller_     │                      │
│  │           │ │ account            │                      │
│  └───────────┘ └────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Services Layer                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Interfaces                           │ │
│  │  IUserService  │  IBillerService  │  IPaymentService   │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Mock Implementations                    │ │
│  │  MockUserService │ MockBillerService │ MockPaymentSvc  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 LangGraph State Flow

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
                         ▼
                   ┌───────────┐
              ┌────│   Agent   │────┐
              │    └───────────┘    │
              │                     │
      has_tool_calls         no_tool_calls
              │                     │
              ▼                     ▼
        ┌───────────┐         ┌─────────┐
        │   Tools   │         │   END   │
        └─────┬─────┘         └─────────┘
              │
              └────────────────┐
                               │
                               ▼
                         (back to Agent)
```

---

## 5. Project Structure

### 5.1 Directory Layout

```
bpay-agent/
├── package.json                    # Project metadata & scripts
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment template
├── .env                            # Environment variables (gitignored)
├── .gitignore                      # Git ignore patterns
├── docs/
│   ├── IMPLEMENTATION_PLAN.md      # This file
│   └── IMPLEMENTATION_LOG.md       # Actual implementation steps
└── src/
    ├── index.ts                    # Application entry point
    ├── config/
    │   └── index.ts                # Configuration management
    ├── types/
    │   ├── index.ts                # Type re-exports
    │   ├── user.types.ts           # User-related types
    │   ├── biller.types.ts         # Biller account types
    │   ├── payment.types.ts        # Payment types
    │   └── tool.types.ts           # Tool result types
    ├── tools/
    │   ├── index.ts                # Tool registry
    │   ├── schemas/                # Zod schemas
    │   │   ├── get-user.schema.ts
    │   │   ├── get-saved-billers.schema.ts
    │   │   ├── validate-biller.schema.ts
    │   │   ├── pay-bill.schema.ts
    │   │   └── create-biller.schema.ts
    │   ├── get-user.tool.ts
    │   ├── get-saved-billers.tool.ts
    │   ├── validate-biller.tool.ts
    │   ├── pay-bill.tool.ts
    │   └── create-biller.tool.ts
    ├── services/
    │   ├── index.ts                # Service exports
    │   ├── interfaces/
    │   │   ├── user.interface.ts
    │   │   ├── biller.interface.ts
    │   │   └── payment.interface.ts
    │   └── mock/
    │       ├── data.ts             # In-memory data store
    │       ├── user.service.ts
    │       ├── biller.service.ts
    │       └── payment.service.ts
    ├── agent/
    │   ├── index.ts                # Agent exports
    │   ├── bpay-agent.ts           # Main agent class
    │   └── prompts/
    │       └── system.prompt.ts    # System prompt
    ├── cli/
    │   ├── index.ts                # CLI class
    │   ├── readline.ts             # Readline wrapper
    │   ├── streaming.ts            # Streaming output
    │   └── colors.ts               # Terminal colors
    └── utils/
        └── errors.ts               # Error classes
```

### 5.2 File Responsibilities

| File | Responsibility | Key Exports |
|------|----------------|-------------|
| `src/index.ts` | Entry point, config validation | `main()` |
| `src/config/index.ts` | Environment config | `config` object |
| `src/agent/bpay-agent.ts` | LangGraph agent | `BPAYAgent` class |
| `src/agent/prompts/system.prompt.ts` | Intent classification rules | `BPAY_SYSTEM_PROMPT` |
| `src/tools/index.ts` | Tool registry | `bpayTools` array |
| `src/services/index.ts` | Service exports | `userService`, `billerService`, `paymentService` |
| `src/cli/index.ts` | CLI orchestration | `CLI` class |

---

## 6. Type Definitions

### 6.1 User Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface JWTPayload {
  sub: string;      // user_id
  email: string;
  exp: number;
  iat: number;
}
```

### 6.2 Biller Types

```typescript
interface BillerAccount {
  id: string;
  userId: string;
  billerCode: string;        // BPAY biller code (e.g., "23796")
  billerName: string;        // e.g., "Sydney Water"
  accountNumber: string;     // Customer's account number
  accountRef: string;        // Customer reference number (CRN)
  nickname?: string;         // User-defined nickname
  category: BillerCategory;
  isActive: boolean;
  createdAt: Date;
  lastPaidAt?: Date;
}

type BillerCategory =
  | 'utilities'      // water, electricity, gas
  | 'telecom'        // phone, internet
  | 'insurance'
  | 'council'        // council rates
  | 'government'
  | 'other';

interface BillerValidationResult {
  isValid: boolean;
  billerName?: string;
  accountStatus?: 'active' | 'inactive' | 'unknown';
  errorMessage?: string;
}

interface CreateBillerAccountInput {
  billerCode: string;
  billerName: string;
  accountNumber: string;
  accountRef: string;
  nickname?: string;
  category: BillerCategory;
}
```

### 6.3 Payment Types

```typescript
interface Payment {
  id: string;
  userId: string;
  billerAccountId: string;
  amount: number;            // in cents
  currency: 'AUD';
  status: PaymentStatus;
  reference: string;         // Transaction reference
  initiatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  reference?: string;
  message: string;
  errorCode?: string;
}

interface PayBillInput {
  billerCode: string;
  accountNumber: string;
  accountRef: string;
  amount: number;            // in dollars
}
```

### 6.4 Tool Types

```typescript
interface ToolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}
```

---

## 7. Tool Specifications

### 7.1 Tool Overview

| # | Tool Name | Purpose | Required Before |
|---|-----------|---------|-----------------|
| 1 | `get_user` | Get user from JWT | - |
| 2 | `get_saved_biller_accounts` | List saved billers | `get_user` |
| 3 | `validate_biller_account` | Validate biller details | `get_saved_biller_accounts` |
| 4 | `pay_bill` | Process payment | `validate_biller_account` + user confirmation |
| 5 | `create_biller_account` | Add new biller | `get_user` |

### 7.2 Tool Schemas (Zod)

#### get_user
```typescript
const getUserSchema = z.object({
  jwtToken: z.string().describe('The JWT token from the user session'),
});
```

#### get_saved_biller_accounts
```typescript
const getSavedBillersSchema = z.object({
  userId: z.string().describe('The user ID obtained from get_user'),
  nameFilter: z.string().optional().describe('Filter by name/nickname (case-insensitive)'),
  category: z.enum([...]).optional().describe('Category filter'),
});
```

#### validate_biller_account
```typescript
const validateBillerSchema = z.object({
  billerCode: z.string().describe('The BPAY biller code'),
  accountNumber: z.string().describe('The customer account number'),
  accountRef: z.string().describe('The customer reference number (CRN)'),
});
```

#### pay_bill
```typescript
const payBillSchema = z.object({
  userId: z.string().describe('The user ID'),
  billerCode: z.string().describe('The BPAY biller code'),
  accountNumber: z.string().describe('The customer account number'),
  accountRef: z.string().describe('The CRN'),
  amount: z.number().positive().describe('Amount in dollars'),
});
```

#### create_biller_account
```typescript
const createBillerSchema = z.object({
  userId: z.string().describe('The user ID'),
  billerCode: z.string().describe('The BPAY biller code'),
  billerName: z.string().describe('The biller name'),
  accountNumber: z.string().describe('The account number'),
  accountRef: z.string().describe('The CRN'),
  nickname: z.string().optional().describe('Optional nickname'),
  category: z.enum([...]).describe('Biller category'),
});
```

### 7.3 Tool Implementation Pattern

Each tool follows this pattern:

```typescript
export const toolName = new DynamicStructuredTool({
  name: 'tool_name',
  description: 'Clear description for the LLM',
  schema: zodSchema,
  func: async (params) => {
    const result = await service.method(params);
    return JSON.stringify(result);  // Always return JSON string
  },
});
```

---

## 8. Agent Design

### 8.1 System Prompt Structure

The system prompt contains:

1. **Role Definition**: BPAY assistant for Australian banking
2. **Intent Classification Rules**:
   - BPAY-related (HANDLE): pay bills, view billers, add billers
   - Off-topic (REJECT): calendar, weather, transfers, general questions
3. **Tool Calling Sequence**: get_user → get_saved_biller_accounts → validate → pay
4. **Human-in-the-Loop Triggers**: No biller, multiple billers, confirmation, amount
5. **Response Guidelines**: Australian English, $X.XX AUD format, security
6. **Error Handling**: User-friendly messages, no technical details

### 8.2 LangGraph Configuration

```typescript
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

const workflow = new StateGraph(AgentState)
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');
```

### 8.3 Routing Logic

```typescript
const shouldContinue = (state): 'tools' | '__end__' => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    return 'tools';
  }
  return '__end__';
};
```

---

## 9. Human-in-the-Loop Strategy

### 9.1 Trigger Points

| Trigger | Condition | Agent Action |
|---------|-----------|--------------|
| No biller found | `get_saved_biller_accounts` returns 0 | Ask: search again, add manually, or cancel |
| Multiple billers | More than 1 match | Show numbered list, ask to select |
| Amount missing | User didn't specify | Ask: "How much to pay?" |
| Payment confirmation | Before `pay_bill` | Confirm: "Pay $X to Y? (yes/no)" |

### 9.2 Implementation Approach

Human-in-the-loop is implemented via the **system prompt** rather than LangGraph's `interrupt` pattern. The LLM is instructed to:

1. Pause and ask the user when conditions are met
2. Wait for user response before proceeding
3. Always confirm before payment

This approach was chosen for simplicity in the demo. In production, LangGraph's `interrupt` pattern would provide more robust control.

---

## 10. Streaming Implementation

### 10.1 streamEvents API

```typescript
for await (const event of graph.streamEvents(input, { version: 'v2' })) {
  if (event.event === 'on_chat_model_stream') {
    // Token streaming
    yield { type: 'token', content: chunk.content };
  } else if (event.event === 'on_tool_start') {
    // Tool invocation
    yield { type: 'tool_start', content: `Calling ${event.name}...` };
  } else if (event.event === 'on_tool_end') {
    // Tool completion
    yield { type: 'tool_end', content: `${event.name} completed.` };
  }
}
```

### 10.2 Stream Event Types

```typescript
interface StreamEvent {
  type: 'token' | 'tool_start' | 'tool_end' | 'final' | 'error';
  content: string;
  toolName?: string;
}
```

### 10.3 CLI Output Handling

| Event Type | CLI Behavior |
|------------|--------------|
| `token` | `process.stdout.write()` - no newline |
| `tool_start` | Print styled tool indicator |
| `tool_end` | Print completion message |
| `final` | Ensure newline |
| `error` | Print error in red |

---

## 11. Error Handling Strategy

### 11.1 Error Codes

```typescript
enum ErrorCode {
  // Authentication
  INVALID_JWT = 'INVALID_JWT',
  EXPIRED_JWT = 'EXPIRED_JWT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Biller
  BILLER_NOT_FOUND = 'BILLER_NOT_FOUND',
  INVALID_BILLER_CODE = 'INVALID_BILLER_CODE',
  INVALID_ACCOUNT_NUMBER = 'INVALID_ACCOUNT_NUMBER',
  INVALID_CRN = 'INVALID_CRN',

  // Payment
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // System
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### 11.2 User-Friendly Messages

Each error code maps to a user-friendly message:

| Code | User Message |
|------|-------------|
| `INVALID_JWT` | "Your session has expired. Please log in again." |
| `BILLER_NOT_FOUND` | "The requested biller could not be found." |
| `PAYMENT_FAILED` | "The payment could not be processed. Please try again." |

### 11.3 BPAYError Class

```typescript
class BPAYError extends Error {
  constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>);
  toUserMessage(): string;
  toToolResult(): { error: { code: string; message: string } };
}
```

---

## 12. Mock Services Design

### 12.1 Interface-Based Design

```
┌─────────────────────────┐
│      Interface          │
│   (e.g., IUserService)  │
└───────────┬─────────────┘
            │
            │ implements
            ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   MockUserService       │  swap   │   RealUserService       │
│   (in-memory data)      │ ←────→  │   (real API calls)      │
└─────────────────────────┘         └─────────────────────────┘
```

### 12.2 Mock Data

**Users** (2):
- user_001: John Smith
- user_002: Jane Doe

**Biller Accounts** (4 for user_001):
- Sydney Water (utilities)
- AGL Energy (utilities)
- Telstra (telecom)
- Origin Gas (utilities)

**Valid Biller Codes**: 23796, 12345, 54321, 67890, 11111, 99999

**JWT Mapping**:
- `mock_jwt_token_001` → `user_001`
- `mock_jwt_token_002` → `user_002`

### 12.3 Service Methods

| Service | Method | Parameters | Returns |
|---------|--------|------------|---------|
| UserService | `getUserFromToken` | jwtToken | `ToolResult<User>` |
| UserService | `getUserById` | userId | `ToolResult<User>` |
| BillerService | `getSavedBillers` | userId, filters | `ToolResult<BillerAccount[]>` |
| BillerService | `validateBiller` | code, number, ref | `BillerValidationResult` |
| BillerService | `createBiller` | userId, input | `ToolResult<BillerAccount>` |
| PaymentService | `payBill` | userId, input | `PaymentResult` |
| PaymentService | `getPaymentStatus` | paymentId | `ToolResult<{status, message}>` |

---

## 13. CLI Design

### 13.1 Components

| Component | File | Purpose |
|-----------|------|---------|
| CLI | `cli/index.ts` | Main orchestrator |
| ReadlineInterface | `cli/readline.ts` | User input handling |
| StreamingOutput | `cli/streaming.ts` | Real-time output |
| colors | `cli/colors.ts` | ANSI color utilities |

### 13.2 Commands

| Command | Action |
|---------|--------|
| `exit`, `quit`, `q` | Exit application |
| `clear` | Clear conversation, new thread |
| `help` | Show help message |

### 13.3 Visual Design

```
════════════════════════════════════════
       BPAY Payment Assistant
════════════════════════════════════════

  Commands:
    exit    - Quit the application
    clear   - Clear conversation history
    help    - Show available commands

  Example queries:
    "I want to pay my water bill"
    "Show my saved billers"
    "Add a new biller"

You: I want to pay my water bill
```

---

## 14. Implementation Phases

### Phase 1: Project Setup
- Initialize npm project with `package.json`
- Configure TypeScript with `tsconfig.json`
- Create `.env.example` and `.gitignore`
- Set up directory structure

### Phase 2: Types & Interfaces
- Create type definitions in `src/types/`
- Create service interfaces in `src/services/interfaces/`
- Create error utilities in `src/utils/errors.ts`

### Phase 3: Mock Services
- Create mock data store with sample users and billers
- Implement `MockUserService`
- Implement `MockBillerService`
- Implement `MockPaymentService`

### Phase 4: Tool Definitions
- Create Zod schemas for each tool
- Implement 5 tools using `DynamicStructuredTool`
- Create tool registry in `src/tools/index.ts`

### Phase 5: Agent Core
- Write system prompt with intent classification
- Create `BPAYAgent` class with LangGraph
- Configure `MemorySaver` for conversation persistence
- Implement streaming with `streamEvents`

### Phase 6: CLI
- Implement terminal colors utility
- Create readline interface wrapper
- Build streaming output handler
- Create main CLI loop with command handling

### Phase 7: Testing & Polish
- Install dependencies and verify compilation
- Manual end-to-end testing
- Error handling refinement

---

## 15. Dependencies

### 15.1 package.json

```json
{
  "name": "bpay-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@langchain/core": "^0.3.0",
    "@langchain/langgraph": "^0.2.0",
    "@langchain/openai": "^0.3.0",
    "dotenv": "^16.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

### 15.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## Document Information

| Field | Value |
|-------|-------|
| Created | 2024-11-26 |
| Version | 1.0 |
| Status | Complete |
| Author | Claude (AI Assistant) |