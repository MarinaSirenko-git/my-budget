import { supabase } from '@/lib/supabase';

export interface ErrorReport {
  action: string;
  error: unknown;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Безопасно отправляет ошибку в Telegram
 * Санитизирует данные перед отправкой для защиты конфиденциальности
 */
export async function reportErrorToTelegram(report: ErrorReport): Promise<void> {
  try {
    // Санитизируем ошибку - убираем чувствительные данные
    const sanitizedError = sanitizeError(report.error);
    
    const message = {
      action: report.action,
      error: sanitizedError,
      userId: report.userId ? hashUserId(report.userId) : 'anonymous',
      timestamp: new Date().toISOString(),
      context: sanitizeContext(report.context),
    };

    await supabase.functions.invoke('send-to-telegram', {
      body: { 
        message: `🚨 Error: ${report.action}\n\n${JSON.stringify(message, null, 2)}`
      }
    });
  } catch (err) {
    // Не логируем ошибку отправки в Telegram, чтобы избежать бесконечного цикла
    // В development можно оставить console.error для отладки
    if (import.meta.env.DEV) {
      console.error('Failed to send error to Telegram:', err);
    }
  }
}

/**
 * Санитизирует ошибку, убирая чувствительные данные
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // В production убираем стек трейс, оставляем только сообщение
    if (import.meta.env.PROD) {
      return error.message;
    }
    // В development оставляем полный стек для отладки
    return `${error.message}\n${error.stack}`;
  }
  return String(error);
}

/**
 * Санитизирует контекст, убирая чувствительные поля
 */
function sanitizeContext(context?: Record<string, any>): Record<string, any> {
  if (!context) return {};
  
  // Список полей, которые нужно скрыть
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'apiKey', 'accessToken'];
  const sanitized = { ...context };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
    // Также скрываем слишком длинные строки (могут содержать токены)
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 50) + '...[TRUNCATED]';
    }
  }
  
  return sanitized;
}

/**
 * Хеширует user ID для анонимизации
 */
function hashUserId(userId: string): string {
  // Простое хеширование для анонимизации (первые 8 символов base64)
  try {
    return btoa(userId).slice(0, 8);
  } catch {
    return 'unknown';
  }
}

