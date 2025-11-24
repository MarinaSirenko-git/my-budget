/**
 * Утилита для создания slug из имени сценария
 * Поддерживает кириллицу (транслитерация), удаление спецсимволов,
 * замену пробелов на дефисы и приведение к нижнему регистру
 */

// Маппинг кириллицы в латиницу
const cyrillicToLatin: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Транслитерирует кириллицу в латиницу
 */
function transliterate(text: string): string {
  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Создает slug из имени сценария
 * @param name - Имя сценария
 * @returns Нормализованный slug
 */
export function createSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Транслитерация кириллицы
  let slug = transliterate(name);

  // Приведение к нижнему регистру
  slug = slug.toLowerCase();

  // Удаление всех символов кроме букв, цифр, пробелов и дефисов
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Замена пробелов и множественных дефисов на один дефис
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');

  // Удаление дефисов в начале и конце
  slug = slug.replace(/^-+|-+$/g, '');

  // Если slug пустой, возвращаем дефолтное значение
  if (!slug) {
    slug = 'scenario';
  }

  return slug;
}

/**
 * Проверяет, является ли строка валидным slug
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  // Slug должен содержать только латинские буквы, цифры и дефисы
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}

