## Dependencies

LangChain/LangGraph packages must be kept at their latest versions:

- Use pnpm to install the dependencies.

```bash
pnpm install langchain @langchain/core @langchain/langgraph @langchain/openai
```

Required versions (as of November 2025):

- `langchain`: ^1.1.1
- `@langchain/core`: ^1.1.0
- `@langchain/langgraph`: ^1.0.2
- `@langchain/openai`: ^1.1.3
- `zod`: ^4.1.13 (avoid v3.25.76 as it has a memory limit issue with tsc --noEmit)

## Rules

**ESM modules**: Project uses ES modules (`"type": "module"` in package.json). All local imports require `.js` extension even for `.ts` files.

**Define tools**: Use `tool` function from `@langchain/core/tools` to define tools.

- the return result type should follow MCP compatible format.
  - content: array of objects with type and other properties based on the type
    - { type: 'text', text: string }
    - { type: 'image', data: string, mimeType: string }
    - { type: 'audio', data: string, mimeType: string }
    - and etc.
  - isError: boolean

```typescript
import { tool } from "@langchain/core/tools";

const add = tool(({ a, b }) {
    const result = a + b;
    return {
        content: [
            type: 'text',
            text: `The result of adding ${a} and ${b} is ${result}`,
        ],
        isError: false,
    }
}, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
```
