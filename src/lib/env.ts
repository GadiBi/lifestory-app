// Environment variable validation
// This file ensures all required environment variables are present

const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'ANTHROPIC_API_KEY',
] as const;

type EnvVar = typeof requiredEnvVars[number];

function getEnvVar(key: EnvVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  AUTH_SECRET: getEnvVar('AUTH_SECRET'),
  AUTH_URL: process.env.AUTH_URL || 'http://localhost:3000',
  ANTHROPIC_API_KEY: getEnvVar('ANTHROPIC_API_KEY'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Validate on import in development
if (process.env.NODE_ENV !== 'production') {
  try {
    requiredEnvVars.forEach(getEnvVar);
  } catch (error) {
    console.warn('Environment validation warning:', (error as Error).message);
    console.warn('Some features may not work correctly.');
  }
}
