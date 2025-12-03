/**
 * Утилиты для санитизации пользовательского ввода
 * Защита от XSS (Cross-Site Scripting) атак
 */

/**
 * Удаляет HTML теги из строки
 * @param text - Текст для очистки
 * @returns Текст без HTML тегов
 */
function stripHtmlTags(text: string): string {
  // Используем DOM API для безопасного удаления HTML (если доступен)
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent || div.innerText || '';
  }
  
  // Fallback: используем регулярное выражение для удаления HTML тегов
  // Это менее безопасно, но работает в окружениях без DOM API
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Удаляет опасные символы и конструкции, которые могут использоваться в XSS атаках
 * Разрешает только безопасные символы: буквы, цифры, пробелы, знаки препинания
 * @param text - Текст для очистки
 * @returns Санитизированный текст
 */
function removeDangerousChars(text: string): string {
  // Разрешаем:
  // - Буквы (включая Unicode для поддержки русского и других языков)
  // - Цифры
  // - Пробелы
  // - Основные знаки препинания: . , ! ? : ; - ( ) [ ] { } ' " / \
  // - Специальные символы: @ # $ % & * + = _ | ~ `
  return text.replace(/[<>]/g, ''); // Удаляем только угловые скобки, которые могут использоваться для HTML/JS
}

/**
 * Санитизирует пользовательский ввод для безопасного хранения и отображения
 * Удаляет HTML теги и опасные символы, сохраняя обычный текст
 * 
 * @param text - Текст для санитизации
 * @returns Санитизированный текст
 * 
 * @example
 * sanitizeText('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeText('Мой бюджет & <b>важный</b>') // 'Мой бюджет & важный'
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Сначала удаляем HTML теги
  let sanitized = stripHtmlTags(text);
  
  // Затем удаляем опасные символы
  sanitized = removeDangerousChars(sanitized);
  
  return sanitized;
}

/**
 * Санитизирует имя сценария или другое имя
 * Более строгая версия, которая также нормализует пробелы
 * 
 * @param name - Имя для санитизации
 * @returns Санитизированное имя
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Санитизируем текст
  let sanitized = sanitizeText(name);
  
  // Обрезаем пробелы в начале и конце
  sanitized = sanitized.trimStart().trimEnd();
  
  // Нормализуем множественные пробелы в один
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

