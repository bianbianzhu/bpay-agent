import type { StreamEvent } from '../agent/index.js';
import { colors, styles } from './colors.js';

export class StreamingOutput {
  private buffer: string = '';
  private currentToolName: string | null = null;

  /**
   * Handle a streaming event and output to console
   */
  handleEvent(event: StreamEvent): void {
    switch (event.type) {
      case 'token':
        // Write tokens directly without newline for streaming effect
        process.stdout.write(event.content);
        this.buffer += event.content;
        break;

      case 'tool_start':
        // Show tool invocation with styling
        this.ensureNewLine();
        console.log(styles.tool(`  [Tool] ${event.content}`));
        this.currentToolName = event.toolName || null;
        break;

      case 'tool_end':
        // Show tool completion
        console.log(styles.tool(`  [Done] ${event.content}`));
        this.currentToolName = null;
        break;

      case 'final':
        // Ensure final newline
        this.ensureNewLine();
        break;

      case 'error':
        this.ensureNewLine();
        console.log(styles.error(`\nError: ${event.content}`));
        break;
    }
  }

  /**
   * Ensure we're on a new line
   */
  private ensureNewLine(): void {
    if (this.buffer && !this.buffer.endsWith('\n')) {
      console.log();
    }
    this.buffer = '';
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }

  /**
   * Show a simple loading message
   */
  showLoading(message: string): void {
    process.stdout.write(colors.dim(`${message}...`));
  }

  /**
   * Clear loading message
   */
  clearLoading(): void {
    process.stdout.write('\r\x1b[K');
  }
}
