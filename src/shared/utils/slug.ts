/**
 * Транслитерирует русский текст в slug (латиница, цифры, дефисы)
 * Аналог серверной функции slugify_ru
 * 
 * @param name - Исходное имя для преобразования
 * @returns Slug в формате латиницы с дефисами
 */
export function slugifyRu(name: string | null | undefined): string {
  if (!name) {
    return 'scenario';
  }

  let s = name.toLowerCase();

  // Маппинг русских символов на латиницу
  const transliterationMap: Record<string, string> = {
    'а': 'a',
    'б': 'b',
    'в': 'v',
    'г': 'g',
    'д': 'd',
    'е': 'e',
    'ё': 'yo',
    'ж': 'zh',
    'з': 'z',
    'и': 'i',
    'й': 'y',
    'к': 'k',
    'л': 'l',
    'м': 'm',
    'н': 'n',
    'о': 'o',
    'п': 'p',
    'р': 'r',
    'с': 's',
    'т': 't',
    'у': 'u',
    'ф': 'f',
    'х': 'h',
    'ц': 'ts',
    'ч': 'ch',
    'ш': 'sh',
    'щ': 'sch',
    'ъ': '',
    'ы': 'y',
    'ь': '',
    'э': 'e',
    'ю': 'yu',
    'я': 'ya',
  };

  // Транслитерация (посимвольная замена)
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    result += transliterationMap[char] || char;
  }
  s = result;

  // Оставить только латиницу, цифры, пробелы и дефисы
  s = s.replace(/[^a-z0-9\s-]/g, '');

  // Пробелы -> дефисы
  s = s.replace(/\s+/g, '-');

  // Схлопнуть повторные дефисы
  s = s.replace(/-+/g, '-');

  // Обрезать дефисы по краям
  s = s.replace(/^-+|-+$/g, '');

  // Если результат пустой, вернуть дефолтное значение
  if (!s) {
    return 'scenario';
  }

  return s;
}

/**
 * Создает slug из имени (алиас для slugifyRu для обратной совместимости)
 * 
 * @param name - Исходное имя для преобразования
 * @returns Slug в формате латиницы с дефисами
 */
export function createSlug(name: string | null | undefined): string {
  return slugifyRu(name);
}



