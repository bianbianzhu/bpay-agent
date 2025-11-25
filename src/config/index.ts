import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'openai/gpt-oss-20b',
  MOCK_JWT_TOKEN: process.env.MOCK_JWT_TOKEN || 'mock_jwt_token_001',
  ENABLE_DEBUG_LOGGING: process.env.ENABLE_DEBUG_LOGGING === 'true',
};
