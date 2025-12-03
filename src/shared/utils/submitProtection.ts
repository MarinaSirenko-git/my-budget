/**
 * Утилиты для защиты от множественных запросов к серверу
 * Защита от ботов и случайных повторных кликов
 * 
 * ВАЖНО: Основная защита реализована через проверку состояния submitting/saving/creating
 * в начале каждого handleSubmit. Эти утилиты являются дополнительными мерами защиты.
 */

import type React from 'react';

/**
 * Создает защищенную функцию отправки формы
 * Предотвращает множественные вызовы во время выполнения запроса
 * 
 * @param submitFn - Функция отправки формы
 * @param isSubmittingRef - Ref для отслеживания состояния отправки
 * @returns Защищенная функция отправки
 * 
 * @example
 * const isSubmittingRef = useRef(false);
 * const protectedSubmit = createProtectedSubmit(handleSubmit, isSubmittingRef);
 */
export function createProtectedSubmit<T extends (...args: any[]) => Promise<any>>(
  submitFn: T,
  isSubmittingRef: React.MutableRefObject<boolean>
): T {
  return (async (...args: Parameters<T>) => {
    // Если запрос уже выполняется, игнорируем новый вызов
    if (isSubmittingRef.current) {
      console.warn('Submit already in progress, ignoring duplicate request');
      return;
    }

    try {
      isSubmittingRef.current = true;
      return await submitFn(...args);
    } finally {
      isSubmittingRef.current = false;
    }
  }) as T;
}

/**
 * Проверяет, можно ли выполнить запрос (не выполняется ли уже другой запрос)
 * @param isSubmitting - Флаг состояния отправки
 * @returns true, если запрос можно выполнить
 */
export function canSubmit(isSubmitting: boolean): boolean {
  return !isSubmitting;
}

/**
 * Минимальная задержка между запросами (в миллисекундах)
 * Защита от быстрых повторных кликов
 */
export const MIN_SUBMIT_DELAY = 500;

/**
 * Создает debounced функцию отправки
 * Предотвращает вызовы чаще, чем раз в MIN_SUBMIT_DELAY миллисекунд
 * 
 * @param submitFn - Функция отправки
 * @param delay - Задержка в миллисекундах (по умолчанию MIN_SUBMIT_DELAY)
 * @returns Debounced функция
 */
export function createDebouncedSubmit<T extends (...args: any[]) => any>(
  submitFn: T,
  delay: number = MIN_SUBMIT_DELAY
): T {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Если прошло достаточно времени, выполняем сразу
    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      return submitFn(...args);
    }

    // Иначе отменяем предыдущий отложенный вызов и планируем новый
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const remainingDelay = delay - timeSinceLastCall;
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      submitFn(...args);
      timeoutId = null;
    }, remainingDelay);
  }) as T;
}

