# BPAY Agent - Design Decisions & Rationale

This document explains the key design decisions made in the BPAY Agent system and the reasoning behind them.

---

## 1. Architecture Decisions

### 1.1 LangGraph over Simple ReAct Loop

**Decision**: Use LangGraph's StateGraph instead of a simple ReAct loop.

**Rationale**:
1. **Built-in Checkpointing**: LangGraph provides `MemorySaver` for conversation persistence without custom implementation
2. **Visual Debugging**: StateGraph can be visualized and debugged more easily
3. **Conditional Routing**: Native support for conditional edges based on LLM output
4. **Extensibility**: Easy to add more nodes (e.g., validation, logging) without restructuring
5. **Streaming Support**: Built-in `streamEvents` API for real-time output

**Alternatives Considered**:
- Simple while loop with tool dispatch: Simpler but lacks persistence and streaming
- LangChain AgentExecutor: Less control over the execution flow

### 1.2 Local LLM Proxy (localhost:1234)

**Decision**: Configure ChatOpenAI to use a local proxy URL.

**Rationale**:
1. **Cost Control**: Development without API costs
2. **Latency**: Faster responses with local models
3. **Privacy**: Sensitive banking data stays local during development
4. **Flexibility**: Easy to switch between local (LM Studio, Ollama) and cloud

**Trade-offs**:
- Requires local LLM setup
- Model quality may differ from cloud models
- Not production-ready configuration

### 1.3 ES Modules (type: "module")

**Decision**: Use ES Modules instead of CommonJS.

**Rationale**:
1. **Modern Standard**: ES Modules are the JavaScript standard
2. **Tree Shaking**: Better bundling optimization potential
3. **LangChain Compatibility**: LangChain.js is ESM-first
4. **Async Imports**: Native support for dynamic imports

**Consequences**:
- All local imports require `.js` extension even for `.ts` files
- Some older packages may need special handling

---

## 2. Layer Design Decisions

### 2.1 Service Interface Pattern

**Decision**: Define service interfaces in `/interfaces/` with separate implementations.

**Rationale**:
1. **Testability**: Mock implementations can be swapped in tests
2. **Flexibility**: Production implementations can replace mocks
3. **Separation of Concerns**: Interface defines contract, implementation handles details
4. **Type Safety**: Interfaces enforce consistent API across implementations

```typescript
// Interface defines the contract
interface IUserService {
  getUserFromToken(jwt: string): Promise<ToolResult<User>>;
}

// Mock implements for development
class MockUserService implements IUserService {
  async getUserFromToken(jwt: string) { /* mock logic */ }
}

// Production would implement same interface
class ProductionUserService implements IUserService {
  async getUserFromToken(jwt: string) { /* real API calls */ }
}
```

**Why Not Dependency Injection Framework?**:
- Overkill for current scope
- Simple export swap in `services/index.ts` suffices
- No runtime DI overhead

### 2.2 Zod Schema per Tool

**Decision**: Separate schema files for each tool in `/schemas/`.

**Rationale**:
1. **Separation of Concerns**: Schema separate from tool logic
2. **Type Inference**: `z.infer<typeof schema>` generates TypeScript types
3. **LLM Documentation**: `.describe()` on fields guides the LLM
4. **Validation**: Runtime validation before service calls

```typescript
// Schema with descriptions for LLM
export const payBillSchema = z.object({
  amount: z.number()
    .positive()
    .describe('The payment amount in dollars (e.g., 150.50)'),
});

// Type automatically derived
export type PayBillInput = z.infer<typeof payBillSchema>;
```

### 2.3 JSON-Stringified Tool Results

**Decision**: All tools return `JSON.stringify(result)` rather than objects.

**Rationale**:
1. **LLM Compatibility**: LLMs work with text, not objects
2. **Consistency**: Uniform return type across all tools
3. **Serialization**: Handles Date objects, nested structures
4. **Debugging**: Easy to log and inspect

**Alternative**: Return structured objects and let LangChain serialize. Rejected because explicit serialization gives more control over format.

---

## 3. Agent Design Decisions

### 3.1 JWT in Message Context

**Decision**: Embed JWT token in the user message as `[JWT: token]\n\n{message}`.

**Rationale**:
1. **Stateless Tools**: Tools don't need access to global state
2. **LLM Guidance**: System prompt tells LLM to extract and use JWT
3. **Simplicity**: No need for tool context injection mechanism

**Trade-offs**:
- JWT visible in conversation history
- Relies on LLM correctly extracting token
- In production, would use secure context passing

### 3.2 System Prompt as Guardrails

**Decision**: Heavy reliance on system prompt for behavior control.

**Rationale**:
1. **Intent Classification**: LLM decides what's BPAY-related
2. **Tool Sequencing**: Prompt defines expected tool order
3. **HITL Rules**: Prompt mandates user confirmation
4. **Response Style**: Australian English, currency format

**Why Not Code-Based Guards?**:
- More flexible for natural language variations
- Easier to update without code changes
- LLM can handle edge cases intelligently

**Risks**:
- Prompt injection attacks
- LLM may not always follow instructions
- No hard enforcement of rules

### 3.3 Human-in-the-Loop via System Prompt

**Decision**: HITL requirements defined in system prompt, not code.

**Rationale**:
1. **Flexibility**: LLM can adapt confirmation flow to context
2. **Natural Language**: Confirmations feel conversational
3. **Less Code**: No custom confirmation state machine

**Trade-offs**:
- LLM might skip confirmation (prompt adherence issue)
- No programmatic guarantee of confirmation
- In production, would add code-level safeguards

---

## 4. Data Design Decisions

### 4.1 In-Memory Mock Data Store

**Decision**: Use JavaScript Maps for mock data storage.

**Rationale**:
1. **Zero Setup**: No database configuration needed
2. **Fast Development**: Changes immediate, no migrations
3. **Reset on Restart**: Clean state for each session
4. **Simple**: Easy to understand and modify

```typescript
export const mockData = {
  users: new Map<string, User>(),
  billerAccounts: new Map<string, BillerAccount>(),
  payments: new Map<string, Payment>(),
};
```

### 4.2 Simulated Latency

**Decision**: Add artificial delays to mock service methods.

**Rationale**:
1. **Realistic Testing**: Simulates real API latency
2. **UX Validation**: Test loading states and streaming
3. **Edge Cases**: Discover race conditions early

```typescript
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async getUserFromToken(jwt: string) {
  await delay(100); // Simulate network
  // ...
}
```

### 4.3 Amount in Cents (Internal)

**Decision**: Store payment amounts in cents internally, accept dollars externally.

**Rationale**:
1. **Precision**: Avoid floating-point errors (`150.10` vs `150.09999...`)
2. **Industry Standard**: Financial systems use smallest currency unit
3. **UX Friendly**: Users think in dollars, system stores in cents

```typescript
// Tool input (user-friendly)
z.number().describe('Payment amount in dollars (e.g., 150.50)')

// Internal storage
amount: Math.round(input.amount * 100) // cents
```

---

## 5. CLI Design Decisions

### 5.1 ANSI Colors Without Library

**Decision**: Use raw ANSI escape codes instead of a color library.

**Rationale**:
1. **Zero Dependencies**: No need for `chalk`, `colors`, etc.
2. **Full Control**: Exact color codes we need
3. **Size**: Smaller bundle without color library
4. **Simplicity**: ~30 lines of code covers all needs

```typescript
export const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[39m`,
  green: (text: string) => `\x1b[32m${text}\x1b[39m`,
  // ...
};
```

**Trade-off**: No automatic terminal capability detection.

### 5.2 Streaming Event Handler Class

**Decision**: Dedicated `StreamingOutput` class for event handling.

**Rationale**:
1. **State Management**: Track buffer, current tool
2. **Separation**: Output logic separate from CLI logic
3. **Testability**: Can mock/test streaming independently
4. **Reusability**: Could be used in different UI contexts

### 5.3 Simple Command Handling

**Decision**: Simple switch statement for commands.

**Rationale**:
1. **Few Commands**: Only exit, clear, help needed
2. **No Framework Needed**: No yargs, commander, etc.
3. **Easy to Extend**: Add more cases as needed

**Alternative**: Command pattern or plugin system. Rejected as over-engineering for current scope.

---

## 6. Error Handling Decisions

### 6.1 Typed Error Codes

**Decision**: Enum-based error codes with user message mapping.

**Rationale**:
1. **Type Safety**: Compiler catches invalid error codes
2. **Consistency**: Same error always has same message
3. **i18n Ready**: Message mapping can be per-locale
4. **Logging**: Error codes useful for monitoring

```typescript
enum ErrorCode {
  INVALID_JWT = 'INVALID_JWT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  // ...
}

const USER_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_JWT]: 'Your session has expired. Please log in again.',
  // ...
};
```

### 6.2 ToolResult Generic Type

**Decision**: Generic `ToolResult<T>` for all service returns.

**Rationale**:
1. **Consistent Interface**: All services return same shape
2. **Type Safety**: Generic provides specific data type
3. **Error Handling**: Built-in error field, no exceptions
4. **Composable**: Easy to chain operations

```typescript
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ToolError;
}

// Usage
const result = await userService.getUserFromToken(jwt);
if (!result.success) {
  return { error: result.error };
}
const user = result.data; // Typed as User
```

---

## 7. Security Considerations

### 7.1 Last 4 Digits Only

**Decision**: System prompt mandates showing only last 4 digits of account numbers.

**Rationale**:
1. **Data Minimization**: Don't expose full account numbers
2. **Identification**: Still allows user to recognize accounts
3. **Compliance**: Aligns with banking security practices

### 7.2 Payment Confirmation

**Decision**: Mandatory payment confirmation before `pay_bill`.

**Rationale**:
1. **User Protection**: Prevent accidental payments
2. **Fraud Prevention**: User must actively confirm
3. **Audit Trail**: Clear record of user consent

**Implementation Gap**: Currently enforced via prompt only, not code.

### 7.3 JWT Token Handling

**Decision**: Pass JWT in message context, mock validation.

**Rationale** (for development):
1. **Simplicity**: No actual JWT parsing/validation
2. **Focus**: Test agent behavior, not auth

**Production Needs**:
- Proper JWT validation
- Token refresh handling
- Secure context injection (not in message)

---

## 8. Testing Considerations

### 8.1 Mock Service Pattern

**Decision**: Interface-based services with mock implementations.

**Testing Benefits**:
1. **Unit Tests**: Inject mock services into tools
2. **Integration Tests**: Test full agent with mocks
3. **E2E Tests**: Swap in real services

### 8.2 Deterministic Output

**Decision**: LLM temperature set to 0.

**Rationale**:
1. **Reproducibility**: Same input should give same output
2. **Testing**: Easier to write assertions
3. **Debugging**: Consistent behavior during development

---

## 9. What's Not Implemented (Intentionally)

### 9.1 Real JWT Validation
**Why**: Development focus, would add complexity without testing benefit.

### 9.2 Rate Limiting
**Why**: Local LLM, no cost concerns. Production would need this.

### 9.3 Logging Framework
**Why**: Console sufficient for development. Production needs structured logging.

### 9.4 Database Persistence
**Why**: In-memory simpler for development. Would need DB for production.

### 9.5 Authentication/Authorization
**Why**: Mock JWT sufficient. Production needs full auth flow.

### 9.6 API Layer
**Why**: CLI-only for development. Would need REST/GraphQL for production.

---

## 10. Design Principles Applied

| Principle | Application |
|-----------|-------------|
| **SOLID - SRP** | Each class/module has single responsibility |
| **SOLID - OCP** | Services open for extension via interfaces |
| **SOLID - DIP** | Tools depend on interfaces, not implementations |
| **DRY** | Shared types, utilities, color functions |
| **KISS** | Simple implementations, no over-engineering |
| **YAGNI** | No features implemented "for future" |
| **Separation of Concerns** | Clear layer boundaries |
| **Fail Fast** | Config validation at startup |
