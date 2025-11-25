import { CLI } from './cli/index.js';
import { config } from './config/index.js';
import { colors } from './cli/colors.js';

async function main() {
  // Validate configuration
  if (!config.OPENAI_API_KEY) {
    console.error(colors.red('\nError: OPENAI_API_KEY environment variable is required.'));
    console.error(colors.dim('Please create a .env file with your OpenAI API key:'));
    console.error(colors.dim('  OPENAI_API_KEY=your_api_key_here\n'));
    process.exit(1);
  }

  const cli = new CLI();

  try {
    await cli.run();
  } catch (error) {
    console.error(colors.red('\nFatal error:'), error);
    process.exit(1);
  }
}

main();
