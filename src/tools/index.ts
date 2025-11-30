import { getUserTool } from './get-user.tool.js';
import { getSavedBillersTool } from './get-saved-billers.tool.js';
import { validateBillerTool } from './validate-biller.tool.js';
import { payBillTool } from './pay-bill.tool.js';
import { createBillerTool } from './create-biller.tool.js';
import { getContactsTool } from './get-contacts.tool.js';
import { getAccountsTool } from './get-accounts.tool.js';
import { transferInternalTool } from './transfer-internal.tool.js';
import { transferExternalTool } from './transfer-external.tool.js';
import { transferBpayTool } from './transfer-bpay.tool.js';

// All BPAY tools as an array for the agent
export const bpayTools = [
  getUserTool,
  getSavedBillersTool,
  validateBillerTool,
  payBillTool,
  createBillerTool,
  getContactsTool,
  getAccountsTool,
  transferInternalTool,
  transferExternalTool,
  transferBpayTool,
];

// Named exports for individual tool access
export {
  getUserTool,
  getSavedBillersTool,
  validateBillerTool,
  payBillTool,
  createBillerTool,
  getContactsTool,
  getAccountsTool,
  transferInternalTool,
  transferExternalTool,
  transferBpayTool,
};
