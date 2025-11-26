## Dependencies

LangChain/LangGraph packages must be kept at their latest versions:

```bash
npm install langchain @langchain/core @langchain/langgraph @langchain/openai
```

Required versions (as of November 2025):

- `langchain`: ^1.1.1
- `@langchain/core`: ^1.1.0
- `@langchain/langgraph`: ^1.0.2
- `@langchain/openai`: ^1.1.3
- `zod`: ^4.1.13 (avoid v3.25.76 as it has a memory limit issue with tsc --noEmit)

**ESM modules**: Project uses ES modules (`"type": "module"` in package.json). All local imports require `.js` extension even for `.ts` files.
