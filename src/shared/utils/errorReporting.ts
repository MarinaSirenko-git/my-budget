import { supabase } from '@/lib/supabase';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'auth', 'apiKey', 'accessToken'];
const MAX_STRING_LENGTH = 100;
const MAX_TRUNCATED_LENGTH = 50;
const HASH_LENGTH = 8;
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

function isProduction(): boolean {
  return import.meta.env.PROD;
}

export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

export interface ErrorReport {
  action: string;
  error: unknown;
  userId?: string;
  context?: ErrorContext;
}

function formatErrorMessage(report: ErrorReport, sanitizedError: string, sanitizedContext: ErrorContext): string {
  const header = `🚨 Error: ${report.action}`;
  const userId = report.userId ? hashUserId(report.userId) : 'anonymous';
  const timestamp = new Date().toISOString();
  
  let message = `${header}\n\n`;
  message += `User: ${userId}\n`;
  message += `Time: ${timestamp}\n\n`;
  message += `Error:\n${sanitizedError}\n`;
  
  if (Object.keys(sanitizedContext).length > 0) {
    message += `\nContext:\n${JSON.stringify(sanitizedContext, null, 2)}`;
  }
  
  if (message.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
    const truncatedLength = TELEGRAM_MAX_MESSAGE_LENGTH - 100;
    message = message.substring(0, truncatedLength) + '\n\n...[MESSAGE TRUNCATED]';
  }
  
  return message;
}

export async function reportErrorToTelegram(report: ErrorReport): Promise<void> {
  try {
    const sanitizedError = sanitizeError(report.error);
    const sanitizedContext = sanitizeContext(report.context);
    const formattedMessage = formatErrorMessage(report, sanitizedError, sanitizedContext);

    await supabase.functions.invoke('send-message-to-telegram', {
      body: { 
        message: formattedMessage
      }
    });
  } catch (err) {
    if (isDevelopment()) {
      console.error('Failed to send error to Telegram:', err);
    }
  }
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code;
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function sanitizeError(error: unknown): string {
  const errorCode = getErrorCode(error);
  const errorMessage = getErrorMessage(error);
  
  let result = errorMessage;
  
  if (errorCode) {
    result = `[${errorCode}] ${result}`;
  }
  
  if (error instanceof Error && !isProduction()) {
    if (error.stack) {
      result += `\n${error.stack}`;
    }
  }
  
  return result;
}

function sanitizeContext(context?: ErrorContext): ErrorContext {
  if (!context) return {};
  
  const sanitized: ErrorContext = { ...context };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    const value = sanitized[key];
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      sanitized[key] = value.substring(0, MAX_TRUNCATED_LENGTH) + '...[TRUNCATED]';
    }
  }
  
  return sanitized;
}

function hashUserId(userId: string): string {
  try {
    return btoa(userId).slice(0, HASH_LENGTH);
  } catch {
    return 'unknown';
  }
}


