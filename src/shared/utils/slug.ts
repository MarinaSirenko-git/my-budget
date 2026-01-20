export function slugifyRu(name: string | null | undefined): string {
  if (!name) {
    return 'scenario';
  }

  let s = name.toLowerCase();

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

  let result = '';
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    result += transliterationMap[char] || char;
  }
  s = result;

  s = s.replace(/[^a-z0-9\s-]/g, '');

  s = s.replace(/\s+/g, '-');

  s = s.replace(/-+/g, '-');

  s = s.replace(/^-+|-+$/g, '');

  if (!s) {
    return 'scenario';
  }

  return s;
}

export function createSlug(name: string | null | undefined): string {
  return slugifyRu(name);
}





