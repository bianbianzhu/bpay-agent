import { TransferAgent } from '../agent/index.js';
import { ReadlineInterface } from './readline.js';
import { StreamingOutput } from './streaming.js';
import { colors, styles } from './colors.js';
import { config } from '../config/index.js';

export class CLI {
  private agent: TransferAgent;
  private rl: ReadlineInterface;
  private streaming: StreamingOutput;
  private threadId: string;
  private jwtToken: string;

  constructor() {
    this.agent = new TransferAgent();
    this.rl = new ReadlineInterface();
    this.streaming = new StreamingOutput();
    this.threadId = `session_${Date.now()}`;
    this.jwtToken = config.MOCK_JWT_TOKEN;
  }

  /**
   * Display welcome message
   */
  private showWelcome(): void {
    console.log();
    console.log(styles.header('════════════════════════════════════════'));
    console.log(styles.header('        Transfer Assistant'));
    console.log(styles.header('════════════════════════════════════════'));
    console.log();
    console.log(colors.dim('  Commands:'));
    console.log(colors.dim('    exit    - Quit the application'));
    console.log(colors.dim('    clear   - Clear conversation history'));
    console.log(colors.dim('    help    - Show available commands'));
    console.log();
    console.log(colors.dim('  Example queries:'));
    console.log(colors.dim('    "Transfer $100 to my savings account"'));
    console.log(colors.dim('    "Send $50 to John"'));
    console.log(colors.dim('    "Pay my electricity bill"'));
    console.log();
  }

  /**
   * Handle special commands
   */
  private handleCommand(input: string): boolean {
    const command = input.toLowerCase().trim();

    switch (command) {
      case 'exit':
      case 'quit':
      case 'q':
        console.log(colors.cyan('\nGoodbye! Thank you for using Transfer Assistant.\n'));
        return true;

      case 'clear':
        this.threadId = `session_${Date.now()}`;
        console.log(colors.green('\nConversation cleared. Starting fresh.\n'));
        return false;

      case 'help':
        console.log();
        console.log(colors.cyan('Available Commands:'));
        console.log(colors.white('  exit, quit, q  - Exit the application'));
        console.log(colors.white('  clear          - Start a new conversation'));
        console.log(colors.white('  help           - Show this help message'));
        console.log();
        console.log(colors.cyan('What I can help with:'));
        console.log(colors.white('  - Transfer money between your own accounts'));
        console.log(colors.white('  - Send money to your saved contacts'));
        console.log(colors.white('  - Pay bills via BPAY'));
        console.log();
        return false;

      default:
        return false;
    }
  }

  /**
   * Main run loop
   */
  async run(): Promise<void> {
    this.showWelcome();

    // Initialize context at session start (fetch user, accounts, contacts)
    await this.agent.initializeContext(this.jwtToken);

    while (true) {
      const userInput = await this.rl.prompt('\nYou: ');

      // Check for empty input
      if (!userInput) {
        continue;
      }

      // Check for commands
      if (this.handleCommand(userInput)) {
        break;
      }

      // Skip if it was a handled command that doesn't exit
      if (['clear', 'help'].includes(userInput.toLowerCase())) {
        continue;
      }

      // Process with agent
      console.log(colors.cyan('\nAssistant: '));

      try {
        for await (const event of this.agent.processMessage(
          userInput,
          this.threadId
        )) {
          this.streaming.handleEvent(event);
        }
      } catch (error) {
        console.log(styles.error(
          `\nError: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`
        ));
        console.log(colors.dim('Please try again or type "help" for assistance.\n'));
      }
    }

    this.rl.close();
  }
}

// Export for programmatic use
export { ReadlineInterface } from './readline.js';
export { StreamingOutput } from './streaming.js';
export { colors, styles } from './colors.js';
