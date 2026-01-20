function stripHtmlTags(text: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent || div.innerText || '';
  }
  
  return text.replace(/<[^>]*>/g, '');
}

function removeDangerousChars(text: string): string {
  return text.replace(/[<>]/g, '');
}

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = stripHtmlTags(text);
  
  sanitized = removeDangerousChars(sanitized);
  
  return sanitized;
}

export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(name);
  
  sanitized = sanitized.trimStart().trimEnd();
  
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

