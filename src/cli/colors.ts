// ANSI color codes for terminal output
export const colors = {
  // Reset
  reset: (text: string) => `\x1b[0m${text}\x1b[0m`,

  // Styles
  bold: (text: string) => `\x1b[1m${text}\x1b[22m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[22m`,
  italic: (text: string) => `\x1b[3m${text}\x1b[23m`,

  // Foreground colors
  red: (text: string) => `\x1b[31m${text}\x1b[39m`,
  green: (text: string) => `\x1b[32m${text}\x1b[39m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[39m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[39m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[39m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[39m`,
  white: (text: string) => `\x1b[37m${text}\x1b[39m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[39m`,

  // Background colors
  bgRed: (text: string) => `\x1b[41m${text}\x1b[49m`,
  bgGreen: (text: string) => `\x1b[42m${text}\x1b[49m`,
  bgYellow: (text: string) => `\x1b[43m${text}\x1b[49m`,
  bgBlue: (text: string) => `\x1b[44m${text}\x1b[49m`,
};

// Compound styles
export const styles = {
  success: (text: string) => colors.green(colors.bold(text)),
  error: (text: string) => colors.red(colors.bold(text)),
  warning: (text: string) => colors.yellow(text),
  info: (text: string) => colors.cyan(text),
  prompt: (text: string) => colors.green(colors.bold(text)),
  tool: (text: string) => colors.cyan(colors.dim(text)),
  header: (text: string) => colors.cyan(colors.bold(text)),
};
