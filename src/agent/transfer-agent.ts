import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage, type BaseMessage } from 'langchain';
import { StateGraph, START, MemorySaver, Annotation, messagesStateReducer } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  transferInternalTool,
  transferExternalTool,
  transferBpayTool,
} from '../tools/index.js';

const transferTools = [transferInternalTool, transferExternalTool, transferBpayTool];
import { TRANSFER_SYSTEM_PROMPT } from './prompts/system.prompt.js';
import { config } from '../config/index.js';
import { userService, accountService, contactService } from '../services/index.js';

// Define the state using Annotation
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

export interface StreamEvent {
  type: 'token' | 'tool_start' | 'tool_end' | 'final' | 'error';
  content: string;
  toolName?: string;
}

export class TransferAgent {
  private model;
  private graph;
  private checkpointer: MemorySaver;
  private userId: string | null = null;
  private userContext: string | null = null;
  private contactsContext: string | null = null;

  constructor(apiKey?: string) {
    const openAIApiKey = apiKey || config.OPENAI_API_KEY;

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    this.model = new ChatOpenAI({
      modelName: config.OPENAI_MODEL,
      temperature: 0,
      streaming: true,
      configuration: {
        ...(config.OPENAI_BASE_URL && { baseURL: config.OPENAI_BASE_URL }),
      },
    }).bindTools(transferTools);

    this.checkpointer = new MemorySaver();
    this.graph = this.createGraph();
  }

  private createGraph() {
    const toolNode = new ToolNode(transferTools);
    const model = this.model;

    // Agent node - calls the LLM
    const agentNode = async (state: typeof AgentState.State) => {
      const response = await model.invoke([
        new SystemMessage(TRANSFER_SYSTEM_PROMPT),
        ...state.messages,
      ]);
      return { messages: [response] };
    };

    // Routing logic
    const shouldContinue = (state: typeof AgentState.State): 'tools' | '__end__' => {
      const lastMessage = state.messages[state.messages.length - 1];

      if (AIMessage.isInstance(lastMessage) && lastMessage.tool_calls?.length) {
        return 'tools';
      }
      return '__end__';
    };

    // Build the graph
    const workflow = new StateGraph(AgentState)
      .addNode('agent', agentNode)
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .addEdge('tools', 'agent');

    return workflow.compile({ checkpointer: this.checkpointer });
  }

  /**
   * Initialize context by fetching user, accounts, and contacts data
   * Call this once at session start
   */
  async initializeContext(jwtToken: string): Promise<void> {
    const userResult = await userService.getUserFromToken(jwtToken);
    if (userResult.success && userResult.data) {
      this.userId = userResult.data.id;
      this.userContext = JSON.stringify(userResult.data);

      const contactsResult = await contactService.getContacts(userResult.data.id);
      if (contactsResult.success) {
        this.contactsContext = JSON.stringify(contactsResult.data);
      }
    }
  }

  /**
   * Build context messages with fresh account data
   * User and contacts are cached, but accounts are fetched fresh each time
   * to reflect balance changes from transfers
   */
  private async buildContextMessages(): Promise<HumanMessage[]> {
    const messages: HumanMessage[] = [];
    if (this.userContext) {
      messages.push(new HumanMessage(`[Current User]\n${this.userContext}`));
    }

    // Always fetch fresh account data to reflect balance updates
    if (this.userId) {
      const accountsResult = await accountService.getDebitCardAccountsV2(this.userId);
      if (accountsResult.success) {
        messages.push(new HumanMessage(`[User's Bank Accounts]\n${JSON.stringify(accountsResult.data)}`));
      }
    }

    if (this.contactsContext) {
      messages.push(new HumanMessage(`[User's Contacts]\n${this.contactsContext}`));
    }
    return messages;
  }

  /**
   * Process a user message with streaming support
   */
  async *processMessage(
    userMessage: string,
    threadId: string
  ): AsyncGenerator<StreamEvent> {
    const configurable = { configurable: { thread_id: threadId } };

    // Build input with fresh context messages followed by user message
    const contextMessages = await this.buildContextMessages();
    const input = {
      messages: [...contextMessages, new HumanMessage(userMessage)],
    };

    try {
      // Use streamEvents for detailed streaming
      for await (const event of this.graph.streamEvents(input, {
        ...configurable,
        version: 'v2' as const,
      })) {
        if (event.event === 'on_chat_model_stream') {
          // Stream tokens as they arrive
          const chunk = event.data.chunk as { content?: string };
          if (chunk?.content && typeof chunk.content === 'string') {
            yield { type: 'token', content: chunk.content };
          }
        } else if (event.event === 'on_tool_start') {
          yield {
            type: 'tool_start',
            content: `Calling ${event.name}...`,
            toolName: event.name,
          };
        } else if (event.event === 'on_tool_end') {
          yield {
            type: 'tool_end',
            content: `${event.name} completed.`,
            toolName: event.name,
          };
        }
      }

      yield { type: 'final', content: '' };
    } catch (error) {
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Process message without streaming (for simpler use cases)
   */
  async processMessageSync(
    userMessage: string,
    threadId: string
  ): Promise<string> {
    const configurable = { configurable: { thread_id: threadId } };

    // Build input with fresh context messages followed by user message
    const contextMessages = await this.buildContextMessages();
    const result = await this.graph.invoke(
      { messages: [...contextMessages, new HumanMessage(userMessage)] },
      configurable
    );

    const lastMessage = result.messages[result.messages.length - 1];
    if (AIMessage.isInstance(lastMessage)) {
      return typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);
    }

    return 'No response generated.';
  }

  /**
   * Get conversation history for a thread
   */
  async getHistory(threadId: string): Promise<BaseMessage[]> {
    const state = await this.graph.getState({ configurable: { thread_id: threadId } });
    return state.values.messages || [];
  }
}
