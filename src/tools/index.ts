import { getUserTool } from './get-user.tool.js';
import { getContactsTool } from './get-contacts.tool.js';
import { getAccountsTool } from './get-accounts.tool.js';
import { transferInternalTool } from './transfer-internal.tool.js';
import { transferExternalTool } from './transfer-external.tool.js';
import { transferBpayTool } from './transfer-bpay.tool.js';

// All tools as an array for the agent
export const bpayTools = [
  getUserTool,
  getContactsTool,
  getAccountsTool,
  transferInternalTool,
  transferExternalTool,
  transferBpayTool,
];

// Named exports for individual tool access
export {
  getUserTool,
  getContactsTool,
  getAccountsTool,
  transferInternalTool,
  transferExternalTool,
  transferBpayTool,
};
