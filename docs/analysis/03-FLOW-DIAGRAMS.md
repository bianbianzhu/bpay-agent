# BPAY Agent - Flow Diagrams

This document contains Mermaid diagrams illustrating the various flows, sequences, and relationships in the BPAY Agent system.

---

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "User Interface"
        CLI[CLI Layer]
    end

    subgraph "Agent Core"
        AGENT[BPAYAgent]
        GRAPH[LangGraph StateGraph]
        MEMORY[MemorySaver]
        PROMPT[System Prompt]
    end

    subgraph "LLM Integration"
        LLM[ChatOpenAI<br/>localhost:1234]
    end

    subgraph "Tools"
        T1[get_user]
        T2[get_saved_billers]
        T3[validate_biller]
        T4[pay_bill]
        T5[create_biller]
    end

    subgraph "Services"
        US[UserService]
        BS[BillerService]
        PS[PaymentService]
    end

    subgraph "Data Store"
        MOCK[(Mock Data<br/>In-Memory)]
    end

    CLI --> AGENT
    AGENT --> GRAPH
    GRAPH --> LLM
    GRAPH --> MEMORY
    PROMPT -.-> LLM

    GRAPH --> T1
    GRAPH --> T2
    GRAPH --> T3
    GRAPH --> T4
    GRAPH --> T5

    T1 --> US
    T2 --> BS
    T3 --> BS
    T4 --> PS
    T5 --> BS

    US --> MOCK
    BS --> MOCK
    PS --> MOCK
```

---

## 2. LangGraph State Machine

```mermaid
stateDiagram-v2
    [*] --> START
    START --> agent: Initial message

    agent --> tools: has tool_calls
    agent --> END: no tool_calls

    tools --> agent: tool results

    END --> [*]

    state agent {
        [*] --> InvokeLLM
        InvokeLLM --> PrepareResponse
        PrepareResponse --> [*]
    }

    state tools {
        [*] --> ExecuteToolCalls
        ExecuteToolCalls --> CollectResults
        CollectResults --> [*]
    }
```

---

## 3. Message Processing Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Agent as BPAYAgent
    participant Graph as StateGraph
    participant LLM as ChatOpenAI
    participant Tools as ToolNode
    participant Service

    User->>CLI: Input message
    CLI->>Agent: processMessage(msg, threadId, jwt)

    Note over Agent: Prepend JWT to message
    Agent->>Graph: invoke with HumanMessage

    loop Until no tool calls
        Graph->>LLM: SystemPrompt + messages
        LLM-->>Graph: AIMessage (with/without tool_calls)

        alt has tool_calls
            Graph->>Tools: Execute tools
            Tools->>Service: Call service method
            Service-->>Tools: Return result
            Tools-->>Graph: ToolMessage with results
        end
    end

    Graph-->>Agent: Final state
    Agent-->>CLI: StreamEvents (tokens, tool_start/end)
    CLI-->>User: Display response
```

---

## 4. Bill Payment Flow

```mermaid
flowchart TD
    START([User: Pay my water bill]) --> GET_USER

    GET_USER[get_user<br/>Extract JWT, get userId]
    GET_USER --> GET_BILLERS

    GET_BILLERS[get_saved_biller_accounts<br/>Filter by 'water']
    GET_BILLERS --> CHECK_RESULTS{Results?}

    CHECK_RESULTS -->|0 results| NO_MATCH[Ask user:<br/>Different search?<br/>Add new biller?]
    CHECK_RESULTS -->|1 result| ASK_AMOUNT{Amount<br/>specified?}
    CHECK_RESULTS -->|Multiple| SELECT[Ask user to<br/>select biller]

    SELECT --> ASK_AMOUNT
    NO_MATCH --> END_FAIL([End - No payment])

    ASK_AMOUNT -->|No| PROMPT_AMOUNT[Ask: How much<br/>to pay?]
    ASK_AMOUNT -->|Yes| VALIDATE
    PROMPT_AMOUNT --> VALIDATE

    VALIDATE[validate_biller_account<br/>Check biller code, account, ref]
    VALIDATE --> VALID_CHECK{Valid?}

    VALID_CHECK -->|No| SHOW_ERROR[Show error,<br/>suggest fix]
    VALID_CHECK -->|Yes| CONFIRM

    SHOW_ERROR --> END_FAIL

    CONFIRM[CONFIRM PAYMENT<br/>Pay $X to Biller?<br/>Type 'yes' to confirm]
    CONFIRM --> USER_CONFIRM{User confirms?}

    USER_CONFIRM -->|No| END_CANCEL([End - Cancelled])
    USER_CONFIRM -->|Yes| PAY_BILL

    PAY_BILL[pay_bill<br/>Process payment]
    PAY_BILL --> PAY_RESULT{Success?}

    PAY_RESULT -->|No| RETRY[Show error,<br/>suggest retry]
    PAY_RESULT -->|Yes| SUCCESS([Success!<br/>Show reference])

    RETRY --> END_FAIL
```

---

## 5. Tool Execution Sequence

```mermaid
sequenceDiagram
    participant Graph as StateGraph
    participant ToolNode
    participant Tool as DynamicStructuredTool
    participant Schema as Zod Schema
    participant Service
    participant Data as Mock Data

    Graph->>ToolNode: tool_calls from LLM

    loop For each tool call
        ToolNode->>Tool: Call with args
        Tool->>Schema: Validate input

        alt Validation fails
            Schema-->>Tool: ZodError
            Tool-->>ToolNode: Error response
        else Validation passes
            Schema-->>Tool: Parsed input
            Tool->>Service: Execute service method
            Service->>Data: Query/mutate
            Data-->>Service: Result
            Service-->>Tool: Service result
            Tool-->>ToolNode: JSON.stringify(result)
        end
    end

    ToolNode-->>Graph: ToolMessages
```

---

## 6. Service Layer Class Diagram

```mermaid
classDiagram
    class IUserService {
        <<interface>>
        +getUserFromToken(jwtToken: string) ToolResult~User~
        +getUserById(userId: string) ToolResult~User~
    }

    class IBillerService {
        <<interface>>
        +getSavedBillers(userId, filters?) ToolResult~BillerAccount[]~
        +validateBiller(code, account, ref) BillerValidationResult
        +createBiller(userId, input) ToolResult~BillerAccount~
    }

    class IPaymentService {
        <<interface>>
        +payBill(userId, input) PaymentResult
        +getPaymentStatus(paymentId) ToolResult
    }

    class MockUserService {
        +getUserFromToken(jwtToken)
        +getUserById(userId)
    }

    class MockBillerService {
        +getSavedBillers(userId, filters?)
        +validateBiller(code, account, ref)
        +createBiller(userId, input)
    }

    class MockPaymentService {
        +payBill(userId, input)
        +getPaymentStatus(paymentId)
    }

    class mockData {
        +users: Map~string, User~
        +billerAccounts: Map~string, BillerAccount~
        +payments: Map~string, Payment~
        +validBillerCodes: Set~string~
    }

    IUserService <|.. MockUserService
    IBillerService <|.. MockBillerService
    IPaymentService <|.. MockPaymentService

    MockUserService --> mockData
    MockBillerService --> mockData
    MockPaymentService --> mockData
```

---

## 7. Type Hierarchy

```mermaid
classDiagram
    class User {
        +id: string
        +email: string
        +name: string
        +createdAt: Date
    }

    class BillerAccount {
        +id: string
        +userId: string
        +billerCode: string
        +billerName: string
        +accountNumber: string
        +accountRef: string
        +nickname?: string
        +category: BillerCategory
        +isActive: boolean
        +createdAt: Date
        +lastPaidAt?: Date
    }

    class Payment {
        +id: string
        +userId: string
        +billerAccountId: string
        +amount: number
        +currency: 'AUD'
        +status: PaymentStatus
        +reference: string
        +initiatedAt: Date
        +completedAt?: Date
        +failureReason?: string
    }

    class ToolResult~T~ {
        +success: boolean
        +data?: T
        +error?: ToolError
    }

    class ToolError {
        +code: string
        +message: string
        +details?: Record
    }

    class BPAYError {
        +code: ErrorCode
        +details?: Record
        +toUserMessage()
        +toToolResult()
    }

    User "1" --> "*" BillerAccount : owns
    User "1" --> "*" Payment : makes
    BillerAccount "1" --> "*" Payment : receives

    ToolResult *-- ToolError
    BPAYError --|> Error
```

---

## 8. CLI Interaction Flow

```mermaid
flowchart TD
    START([Start CLI]) --> WELCOME[Show Welcome]
    WELCOME --> PROMPT[Prompt: "You: "]

    PROMPT --> INPUT{User Input}

    INPUT -->|Empty| PROMPT
    INPUT -->|exit/quit/q| GOODBYE[Show Goodbye]
    INPUT -->|clear| CLEAR[Reset threadId]
    INPUT -->|help| HELP[Show Help]
    INPUT -->|Other| PROCESS

    CLEAR --> PROMPT
    HELP --> PROMPT
    GOODBYE --> END([Exit])

    PROCESS[Process with Agent]
    PROCESS --> STREAM{Stream Events}

    STREAM -->|token| WRITE[Write to stdout]
    STREAM -->|tool_start| TOOL_START[Show tool name]
    STREAM -->|tool_end| TOOL_END[Show completion]
    STREAM -->|error| ERROR[Show error]
    STREAM -->|final| DONE[Ensure newline]

    WRITE --> STREAM
    TOOL_START --> STREAM
    TOOL_END --> STREAM
    ERROR --> PROMPT
    DONE --> PROMPT
```

---

## 9. Streaming Event Flow

```mermaid
sequenceDiagram
    participant Agent as BPAYAgent
    participant Graph as StateGraph.streamEvents
    participant Streaming as StreamingOutput
    participant Console as process.stdout

    Agent->>Graph: streamEvents(input, config)

    loop Event stream
        Graph-->>Agent: StreamEvent

        alt on_chat_model_stream
            Agent-->>Streaming: { type: 'token', content }
            Streaming->>Console: write(content)
        else on_tool_start
            Agent-->>Streaming: { type: 'tool_start', toolName }
            Streaming->>Console: log("[Tool] Calling...")
        else on_tool_end
            Agent-->>Streaming: { type: 'tool_end', toolName }
            Streaming->>Console: log("[Done]...")
        end
    end

    Agent-->>Streaming: { type: 'final' }
    Streaming->>Console: ensureNewLine()
```

---

## 10. Error Handling Flow

```mermaid
flowchart TD
    subgraph "Service Layer"
        SERVICE[Service Method]
        SERVICE --> ERROR_CHECK{Error?}
        ERROR_CHECK -->|Yes| CREATE_ERROR[Create BPAYError<br/>with ErrorCode]
        ERROR_CHECK -->|No| RETURN_SUCCESS[Return ToolResult<br/>success: true]
    end

    subgraph "Tool Layer"
        CREATE_ERROR --> TOOL_RESULT[Return ToolResult<br/>success: false<br/>error: toUserMessage]
        RETURN_SUCCESS --> TOOL_JSON[JSON.stringify result]
        TOOL_RESULT --> TOOL_JSON
    end

    subgraph "Agent Layer"
        TOOL_JSON --> LLM_PROCESS[LLM processes<br/>tool output]
        LLM_PROCESS --> GENERATE_RESPONSE[Generate<br/>user-friendly response]
    end

    subgraph "CLI Layer"
        GENERATE_RESPONSE --> STREAM[Stream to user]
    end

    subgraph "Error Codes"
        EC1[INVALID_JWT]
        EC2[BILLER_NOT_FOUND]
        EC3[PAYMENT_FAILED]
        EC4[INSUFFICIENT_FUNDS]
    end

    CREATE_ERROR -.-> EC1
    CREATE_ERROR -.-> EC2
    CREATE_ERROR -.-> EC3
    CREATE_ERROR -.-> EC4
```

---

## 11. Human-in-the-Loop Decision Points

```mermaid
flowchart TD
    subgraph "HITL Decision Points"
        HITL1[No matching biller]
        HITL2[Multiple matching billers]
        HITL3[Amount not specified]
        HITL4[Payment confirmation]
    end

    HITL1 --> OPTIONS1["Options:<br/>1. Try different search<br/>2. Add new biller<br/>3. Cancel"]

    HITL2 --> OPTIONS2["List billers with numbers<br/>Ask user to select"]

    HITL3 --> OPTIONS3["Ask: How much would you<br/>like to pay to [biller]?"]

    HITL4 --> OPTIONS4["ALWAYS REQUIRED<br/>Confirm: Pay $X to Y?<br/>Type 'yes' to confirm"]

    OPTIONS1 --> USER_CHOICE1{User Choice}
    OPTIONS2 --> USER_CHOICE2{User Selection}
    OPTIONS3 --> USER_AMOUNT{User Amount}
    OPTIONS4 --> USER_CONFIRM{yes/no}

    USER_CHOICE1 -->|1| RETRY_SEARCH[Retry with<br/>different filter]
    USER_CHOICE1 -->|2| CREATE_BILLER[Start create<br/>biller flow]
    USER_CHOICE1 -->|3| CANCEL[Cancel operation]

    USER_CHOICE2 --> CONTINUE[Continue with<br/>selected biller]

    USER_AMOUNT --> VALIDATE[Proceed to<br/>validation]

    USER_CONFIRM -->|yes| EXECUTE[Execute<br/>pay_bill]
    USER_CONFIRM -->|no| CANCEL
```

---

## 12. Module Dependency Graph

```mermaid
graph LR
    subgraph "Entry"
        INDEX[index.ts]
    end

    subgraph "CLI"
        CLI_INDEX[cli/index.ts]
        READLINE[readline.ts]
        STREAMING[streaming.ts]
        COLORS[colors.ts]
    end

    subgraph "Agent"
        AGENT_INDEX[agent/index.ts]
        BPAY_AGENT[bpay-agent.ts]
        SYSTEM_PROMPT[system.prompt.ts]
    end

    subgraph "Tools"
        TOOLS_INDEX[tools/index.ts]
        GET_USER[get-user.tool.ts]
        GET_BILLERS[get-saved-billers.tool.ts]
        VALIDATE[validate-biller.tool.ts]
        PAY_BILL[pay-bill.tool.ts]
        CREATE_BILLER[create-biller.tool.ts]
    end

    subgraph "Schemas"
        SCHEMA_USER[get-user.schema.ts]
        SCHEMA_BILLERS[get-saved-billers.schema.ts]
        SCHEMA_VALIDATE[validate-biller.schema.ts]
        SCHEMA_PAY[pay-bill.schema.ts]
        SCHEMA_CREATE[create-biller.schema.ts]
    end

    subgraph "Services"
        SVC_INDEX[services/index.ts]
        USER_SVC[user.service.ts]
        BILLER_SVC[biller.service.ts]
        PAYMENT_SVC[payment.service.ts]
        MOCK_DATA[data.ts]
    end

    subgraph "Types"
        TYPES_INDEX[types/index.ts]
    end

    subgraph "Config"
        CONFIG[config/index.ts]
    end

    INDEX --> CLI_INDEX
    INDEX --> CONFIG

    CLI_INDEX --> AGENT_INDEX
    CLI_INDEX --> READLINE
    CLI_INDEX --> STREAMING
    CLI_INDEX --> COLORS

    STREAMING --> COLORS
    STREAMING --> AGENT_INDEX

    AGENT_INDEX --> BPAY_AGENT
    BPAY_AGENT --> SYSTEM_PROMPT
    BPAY_AGENT --> TOOLS_INDEX
    BPAY_AGENT --> CONFIG

    TOOLS_INDEX --> GET_USER
    TOOLS_INDEX --> GET_BILLERS
    TOOLS_INDEX --> VALIDATE
    TOOLS_INDEX --> PAY_BILL
    TOOLS_INDEX --> CREATE_BILLER

    GET_USER --> SCHEMA_USER
    GET_USER --> SVC_INDEX
    GET_BILLERS --> SCHEMA_BILLERS
    GET_BILLERS --> SVC_INDEX
    VALIDATE --> SCHEMA_VALIDATE
    VALIDATE --> SVC_INDEX
    PAY_BILL --> SCHEMA_PAY
    PAY_BILL --> SVC_INDEX
    CREATE_BILLER --> SCHEMA_CREATE
    CREATE_BILLER --> SVC_INDEX

    SVC_INDEX --> USER_SVC
    SVC_INDEX --> BILLER_SVC
    SVC_INDEX --> PAYMENT_SVC

    USER_SVC --> MOCK_DATA
    BILLER_SVC --> MOCK_DATA
    PAYMENT_SVC --> MOCK_DATA

    USER_SVC --> TYPES_INDEX
    BILLER_SVC --> TYPES_INDEX
    PAYMENT_SVC --> TYPES_INDEX
```

---

## 13. Conversation State Management

```mermaid
stateDiagram-v2
    [*] --> NewSession: CLI starts

    NewSession --> Active: threadId created

    Active --> Active: User message
    Active --> Active: Agent response
    Active --> Active: Tool execution

    Active --> Cleared: 'clear' command
    Cleared --> Active: New threadId

    Active --> Ended: 'exit' command
    Ended --> [*]

    state Active {
        [*] --> Idle
        Idle --> Processing: User input
        Processing --> Streaming: Agent generates
        Streaming --> Idle: Response complete
        Streaming --> ToolCall: Tool invoked
        ToolCall --> Streaming: Tool complete
    }

    note right of Active
        State persisted in MemorySaver
        Keyed by threadId
    end note
```
