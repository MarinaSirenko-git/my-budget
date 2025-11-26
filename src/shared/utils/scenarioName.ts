/**
 * Утилита для генерации имени сценария
 * Генерирует имя по логике: "Бюджет: {country_ru}" для ru и "Budget: {country_en}" для других языков
 * 
 * Соответствует серверной логике:
 * if v_lang = 'ru' then v_scenario_name := 'Бюджет: ' || v_country_ru;
 * else v_scenario_name := 'Budget: ' || v_country_en;
 * end if;
 * 
 * @example
 * generateScenarioName('ru', 'Россия', 'Russia') // 'Бюджет: Россия'
 * generateScenarioName('en', 'Россия', 'Russia') // 'Budget: Russia'
 */

/**
 * Генерирует имя сценария на основе языка и названия страны
 * @param language - Язык интерфейса ('ru' | 'en' | другие)
 * @param countryRu - Название страны на русском языке
 * @param countryEn - Название страны на английском языке
 * @returns Сгенерированное имя сценария
 */
export function generateScenarioName(
  language: string,
  countryRu: string,
  countryEn: string
): string {
  // Нормализуем язык (приводим к нижнему регистру)
  const normalizedLang = language.toLowerCase();

  // Если язык русский, используем русский формат
  if (normalizedLang === 'ru') {
    return `Бюджет: ${countryRu}`;
  }

  // Для всех остальных языков используем английский формат
  return `Budget: ${countryEn}`;
}

