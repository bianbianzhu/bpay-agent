import * as readline from 'readline';
import { colors, styles } from './colors.js';

export class ReadlineInterface {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompt user for input
   */
  async prompt(message: string = 'You: '): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(styles.prompt(message), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Prompt user to select from numbered options
   */
  async selectOption(options: string[], message: string): Promise<number> {
    console.log(colors.yellow(`\n${message}`));
    options.forEach((opt, i) => {
      console.log(colors.white(`  ${i + 1}. ${opt}`));
    });

    while (true) {
      const input = await this.prompt('Select option (number): ');
      const num = parseInt(input, 10);
      if (num >= 1 && num <= options.length) {
        return num - 1;
      }
      console.log(colors.red('Invalid selection. Please try again.'));
    }
  }

  /**
   * Prompt for yes/no confirmation
   */
  async confirm(message: string): Promise<boolean> {
    const input = await this.prompt(`${message} (yes/no): `);
    return input.toLowerCase().startsWith('y');
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close();
  }
}
