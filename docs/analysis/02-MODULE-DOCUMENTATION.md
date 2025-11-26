# BPAY Agent - Module Documentation

## Table of Contents
1. [Entry Point](#1-entry-point)
2. [Configuration Module](#2-configuration-module)
3. [Agent Module](#3-agent-module)
4. [Tools Module](#4-tools-module)
5. [Services Module](#5-services-module)
6. [CLI Module](#6-cli-module)
7. [Types Module](#7-types-module)
8. [Utilities Module](#8-utilities-module)

---

## 1. Entry Point

### `src/index.ts`

**Purpose**: Application bootstrap and initialization.

```typescript
async function main(): Promise<void>
```

| Aspect | Description |
|--------|-------------|
| **Validates** | `OPENAI_API_KEY` presence |
| **Creates** | `CLI` instance |
| **Runs** | Main REPL loop |
| **Handles** | Fatal errors with graceful exit |

**Flow**:
1. Check API key configuration
2. Instantiate CLI
3. Start run loop
4. Catch and display fatal errors

---

## 2. Configuration Module

### `src/config/index.ts`

**Purpose**: Centralized environment configuration.

```typescript
export const config: {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  MOCK_JWT_TOKEN: string;
  ENABLE_DEBUG_LOGGING: boolean;
}
```

| Property | Source | Default | Notes |
|----------|--------|---------|-------|
| `OPENAI_API_KEY` | `process.env` | `''` | Required |
| `OPENAI_MODEL` | `process.env` | `'openai/gpt-oss-20b'` | Model name |
| `MOCK_JWT_TOKEN` | `process.env` | `'mock_jwt_token_001'` | Maps to user_001 |
| `ENABLE_DEBUG_LOGGING` | `process.env` | `false` | Parsed as boolean |

---

## 3. Agent Module

### `src/agent/bpay-agent.ts`

**Purpose**: Core AI agent orchestration using LangGraph.

#### Class: `BPAYAgent`

```typescript
class BPAYAgent {
  private model: ChatOpenAI;
  private graph: CompiledStateGraph;
  private checkpointer: MemorySaver;
}
```

#### Constructor

```typescript
constructor(apiKey?: string)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | `string?` | Optional API key override |

**Initialization**:
1. Validates API key (param or config)
2. Creates `ChatOpenAI` instance with:
   - Model name from config
   - Temperature: 0 (deterministic)
   - Streaming: enabled
   - Base URL: `http://localhost:1234/v1`
3. Binds BPAY tools to model
4. Creates `MemorySaver` for persistence
5. Compiles state graph

#### Method: `createGraph()`

```typescript
private createGraph(): CompiledStateGraph
```

**State Definition** (via Annotation):
```typescript
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});
```

**Graph Nodes**:

| Node | Type | Function |
|------|------|----------|
| `agent` | Function | Invokes LLM with system prompt + messages |
| `tools` | ToolNode | Executes tool calls from LLM response |

**Graph Edges**:
```
START ──────────────────▶ agent
agent ──(conditional)───▶ tools OR __end__
tools ──────────────────▶ agent
```

**Routing Logic** (`shouldContinue`):
- Returns `'tools'` if last message has tool_calls
- Returns `'__end__'` otherwise

#### Method: `processMessage()`

```typescript
async *processMessage(
  userMessage: string,
  threadId: string,
  jwtToken: string
): AsyncGenerator<StreamEvent>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userMessage` | `string` | User's input text |
| `threadId` | `string` | Conversation identifier |
| `jwtToken` | `string` | User authentication token |

**Returns**: `AsyncGenerator<StreamEvent>` with events:
- `token`: LLM output tokens
- `tool_start`: Tool invocation started
- `tool_end`: Tool invocation completed
- `final`: Processing complete
- `error`: Error occurred

**Message Format**: JWT token prepended as `[JWT: {token}]\n\n{message}`

#### Method: `processMessageSync()`

```typescript
async processMessageSync(
  userMessage: string,
  threadId: string,
  jwtToken: string
): Promise<string>
```

Non-streaming variant for simpler integrations.

#### Method: `getHistory()`

```typescript
async getHistory(threadId: string): Promise<BaseMessage[]>
```

Retrieves conversation history from checkpointer.

---

### `src/agent/prompts/system.prompt.ts`

**Purpose**: Defines agent behavior, constraints, and tool sequence.

```typescript
export const BPAY_SYSTEM_PROMPT: string
```

**Key Sections**:

1. **Intent Classification**:
   - BPAY-related: bill payments, billers, history
   - Off-topic: weather, calendar, transfers, etc.

2. **Tool Calling Sequence**:
   ```
   get_user → get_saved_biller_accounts → validate_biller_account → pay_bill
   ```

3. **Human-in-the-Loop Rules**:
   - No matching biller → ask user
   - Multiple matches → present selection
   - Amount not specified → request amount
   - Payment confirmation → **ALWAYS** required

4. **Response Guidelines**:
   - Australian English
   - Currency as `$X.XX AUD`
   - Last 4 digits only for accounts
   - Include payment reference

5. **Error Handling**:
   - User-friendly messages
   - Suggest next steps
   - No technical details exposed

---

## 4. Tools Module

### `src/tools/index.ts`

**Exports**: `bpayTools` array containing all five tools.

All tools use the `tool` function from `@langchain/core/tools` with MCP-compatible return format:

```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(data) }],
  isError: boolean,
};
```

### Tool: `get_user`

**File**: `src/tools/get-user.tool.ts`

| Aspect | Value |
|--------|-------|
| **Name** | `get_user` |
| **Purpose** | Retrieve user info from JWT token |
| **Schema** | `{ jwtToken: string }` |
| **Returns** | `{ success, userId, userName, email }` |
| **Service** | `userService.getUserFromToken()` |

### Tool: `get_saved_biller_accounts`

**File**: `src/tools/get-saved-billers.tool.ts`

| Aspect | Value |
|--------|-------|
| **Name** | `get_saved_biller_accounts` |
| **Purpose** | Query user's saved billers with optional filters |
| **Schema** | `{ userId, nameFilter?, category? }` |
| **Returns** | `{ success, count, billers[], message? }` |
| **Service** | `billerService.getSavedBillers()` |

**Filtering**:
- `nameFilter`: Case-insensitive partial match on name/nickname/category
- `category`: Exact match on category enum

### Tool: `validate_biller_account`

**File**: `src/tools/validate-biller.tool.ts`

| Aspect | Value |
|--------|-------|
| **Name** | `validate_biller_account` |
| **Purpose** | Validate biller details before payment |
| **Schema** | `{ billerCode, accountNumber, accountRef }` |
| **Returns** | `{ isValid, billerName?, accountStatus?, errorMessage? }` |
| **Service** | `billerService.validateBiller()` |

### Tool: `pay_bill`

**File**: `src/tools/pay-bill.tool.ts`

| Aspect | Value |
|--------|-------|
| **Name** | `pay_bill` |
| **Purpose** | Execute BPAY payment |
| **Schema** | `{ userId, billerCode, accountNumber, accountRef, amount }` |
| **Returns** | `{ success, paymentId?, reference?, message, errorCode? }` |
| **Service** | `paymentService.payBill()` |

**Note**: Amount is in dollars (e.g., 150.50), stored internally in cents.

### Tool: `create_biller_account`

**File**: `src/tools/create-biller.tool.ts`

| Aspect | Value |
|--------|-------|
| **Name** | `create_biller_account` |
| **Purpose** | Add new biller to user's saved list |
| **Schema** | `{ userId, billerCode, billerName, accountNumber, accountRef, nickname?, category }` |
| **Returns** | `{ success, message, billerId, billerDetails }` |
| **Service** | `billerService.createBiller()` |

---

### Tool Schemas

All schemas in `src/tools/schemas/` use Zod with `.describe()` for LLM guidance.

#### Common Patterns:

```typescript
// Required string with description
z.string().describe('The BPAY biller code')

// Optional nullable field
z.string().nullable().optional().describe('Optional nickname')

// Enum with description
z.enum(['utilities', 'telecom', 'insurance', 'council', 'government', 'other'])
  .describe('The category of the biller')

// Positive number
z.number().positive().describe('Payment amount in dollars')
```

---

## 5. Services Module

### `src/services/index.ts`

**Purpose**: Dependency injection entry point.

```typescript
// Export mock implementations (swap for production)
export { userService } from './mock/user.service.js';
export { billerService } from './mock/biller.service.js';
export { paymentService } from './mock/payment.service.js';

// Re-export interfaces
export type { IUserService } from './interfaces/user.interface.js';
export type { IBillerService, GetBillersFilter } from './interfaces/biller.interface.js';
export type { IPaymentService } from './interfaces/payment.interface.js';
```

### Interface: `IUserService`

**File**: `src/services/interfaces/user.interface.ts`

```typescript
interface IUserService {
  getUserFromToken(jwtToken: string): Promise<ToolResult<User>>;
  getUserById(userId: string): Promise<ToolResult<User>>;
}
```

### Interface: `IBillerService`

**File**: `src/services/interfaces/biller.interface.ts`

```typescript
interface IBillerService {
  getSavedBillers(userId: string, filters?: GetBillersFilter): Promise<ToolResult<BillerAccount[]>>;
  validateBiller(billerCode: string, accountNumber: string, accountRef: string): Promise<BillerValidationResult>;
  createBiller(userId: string, input: CreateBillerAccountInput): Promise<ToolResult<BillerAccount>>;
}

interface GetBillersFilter {
  nameFilter?: string;
  category?: string;
}
```

### Interface: `IPaymentService`

**File**: `src/services/interfaces/payment.interface.ts`

```typescript
interface IPaymentService {
  payBill(userId: string, input: PayBillInput): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<ToolResult<{ status: string; message: string }>>;
}
```

---

### Mock Implementations

#### `MockUserService`

**File**: `src/services/mock/user.service.ts`

| Method | Behavior |
|--------|----------|
| `getUserFromToken(jwt)` | Looks up userId via `jwtUserMapping`, returns user |
| `getUserById(id)` | Direct lookup in `mockData.users` |

**Latency**: 100ms for token lookup, 50ms for ID lookup.

#### `MockBillerService`

**File**: `src/services/mock/biller.service.ts`

| Method | Behavior |
|--------|----------|
| `getSavedBillers(userId, filters)` | Filters by userId, nameFilter, category |
| `validateBiller(code, account, ref)` | Checks code validity, account/ref length |
| `createBiller(userId, input)` | Adds to mockData.billerAccounts |

**Latency**: 150ms for query, 200ms for validation, 100ms for creation.

**Validation Rules**:
- Biller code must be in `validBillerCodes` set
- Account number must be >= 6 digits
- Reference number must be >= 4 digits

#### `MockPaymentService`

**File**: `src/services/mock/payment.service.ts`

| Method | Behavior |
|--------|----------|
| `payBill(userId, input)` | Creates payment record, 5% failure rate |
| `getPaymentStatus(paymentId)` | Looks up payment by ID |

**Latency**: 500ms for payment processing.

**Payment ID Format**: `pay_{timestamp}`
**Reference Format**: `REF{timestamp_base36_uppercase}`

---

### Mock Data Store

**File**: `src/services/mock/data.ts`

```typescript
export const mockData = {
  users: Map<string, User>,           // 2 test users
  billerAccounts: Map<string, BillerAccount>,  // 4 billers for user_001
  payments: Map<string, Payment>,     // Empty initially
  validBillerCodes: Set<string>,      // 6 valid codes
};

export const jwtUserMapping: Record<string, string>;  // JWT → userId
export const billerCodeNames: Record<string, string>; // Code → Name
```

**Test Users**:
| ID | Name | Email |
|----|------|-------|
| `user_001` | John Smith | john.smith@example.com |
| `user_002` | Jane Doe | jane.doe@example.com |

**Test Billers** (for user_001):
| Code | Name | Category |
|------|------|----------|
| 23796 | Sydney Water | utilities |
| 12345 | AGL Energy | utilities |
| 54321 | Telstra | telecom |
| 67890 | Origin Gas | utilities |

---

## 6. CLI Module

### `src/cli/index.ts`

**Purpose**: Main CLI orchestrator.

#### Class: `CLI`

```typescript
class CLI {
  private agent: BPAYAgent;
  private rl: ReadlineInterface;
  private streaming: StreamingOutput;
  private threadId: string;
  private jwtToken: string;
}
```

#### Method: `showWelcome()`

```typescript
private showWelcome(): void
```

Displays welcome banner with commands and example queries.

#### Method: `handleCommand()`

```typescript
private handleCommand(input: string): boolean
```

| Command | Action | Returns |
|---------|--------|---------|
| `exit`, `quit`, `q` | Display goodbye, signal exit | `true` |
| `clear` | Reset threadId | `false` |
| `help` | Display help | `false` |
| (other) | No action | `false` |

#### Method: `run()`

```typescript
async run(): Promise<void>
```

Main REPL loop:
1. Show welcome
2. Prompt for input
3. Handle commands or process with agent
4. Stream response tokens
5. Repeat until exit

---

### `src/cli/readline.ts`

**Purpose**: Promisified readline wrapper.

#### Class: `ReadlineInterface`

| Method | Purpose |
|--------|---------|
| `prompt(message)` | Get single line input |
| `selectOption(options, message)` | Number-based selection |
| `confirm(message)` | Yes/no confirmation |
| `close()` | Cleanup |

---

### `src/cli/streaming.ts`

**Purpose**: Real-time stream event handling.

#### Class: `StreamingOutput`

```typescript
class StreamingOutput {
  private buffer: string;
  private currentToolName: string | null;
}
```

| Method | Purpose |
|--------|---------|
| `handleEvent(event)` | Route events to appropriate handler |
| `ensureNewLine()` | Guarantee newline before next output |
| `clearBuffer()` | Reset internal buffer |
| `showLoading(message)` | Display loading indicator |
| `clearLoading()` | Clear loading indicator |

**Event Handling**:
- `token`: Write to stdout (no newline)
- `tool_start`: Display styled tool name
- `tool_end`: Display completion
- `final`: Ensure newline
- `error`: Display styled error

---

### `src/cli/colors.ts`

**Purpose**: ANSI escape code utilities.

```typescript
export const colors = {
  // Text styles
  reset, bold, dim, italic,
  // Foreground colors
  red, green, yellow, blue, magenta, cyan, white, gray,
  // Background colors
  bgRed, bgGreen, bgYellow, bgBlue,
};

export const styles = {
  success: green + bold,
  error: red + bold,
  warning: yellow,
  info: cyan,
  prompt: green + bold,
  tool: cyan + dim,
  header: cyan + bold,
};
```

---

## 7. Types Module

### `src/types/user.types.ts`

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface JWTPayload {
  sub: string;   // user_id
  email: string;
  exp: number;   // Expiration timestamp
  iat: number;   // Issued at timestamp
}
```

### `src/types/biller.types.ts`

```typescript
interface BillerAccount {
  id: string;
  userId: string;
  billerCode: string;
  billerName: string;
  accountNumber: string;
  accountRef: string;
  nickname?: string;
  category: BillerCategory;
  isActive: boolean;
  createdAt: Date;
  lastPaidAt?: Date;
}

type BillerCategory =
  | 'utilities' | 'telecom' | 'insurance'
  | 'council' | 'government' | 'other';

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

### `src/types/payment.types.ts`

```typescript
interface Payment {
  id: string;
  userId: string;
  billerAccountId: string;
  amount: number;          // In cents
  currency: 'AUD';
  status: PaymentStatus;
  reference: string;
  initiatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

type PaymentStatus =
  | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

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
  amount: number;          // In dollars
}
```

### `src/types/tool.types.ts`

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

## 8. Utilities Module

### `src/utils/errors.ts`

**Purpose**: Typed error handling with user-friendly messages.

#### Enum: `ErrorCode`

```typescript
enum ErrorCode {
  // Authentication
  INVALID_JWT, EXPIRED_JWT, USER_NOT_FOUND,

  // Biller
  BILLER_NOT_FOUND, INVALID_BILLER_CODE,
  INVALID_ACCOUNT_NUMBER, INVALID_CRN, BILLER_VALIDATION_FAILED,

  // Payment
  INSUFFICIENT_FUNDS, PAYMENT_LIMIT_EXCEEDED,
  PAYMENT_FAILED, DUPLICATE_PAYMENT,

  // System
  SERVICE_UNAVAILABLE, TIMEOUT, UNKNOWN_ERROR,
}
```

#### Class: `BPAYError`

```typescript
class BPAYError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: Record<string, unknown>
  );

  toUserMessage(): string;     // Returns user-friendly message
  toToolResult(): { error: { code: string; message: string } };
}
```

**User Message Mapping**:
| Code | User Message |
|------|--------------|
| `INVALID_JWT` | Your session has expired. Please log in again. |
| `INSUFFICIENT_FUNDS` | Insufficient funds for this payment. |
| `PAYMENT_FAILED` | The payment could not be processed. Please try again. |
| ... | ... |
