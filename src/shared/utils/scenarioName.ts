export function generateScenarioName(
  language: string,
  countryRu: string,
  countryEn: string
): string {
  const normalizedLang = language.toLowerCase();

  if (normalizedLang === 'ru') {
    return `Бюджет: ${countryRu}`;
  }

  return `Budget: ${countryEn}`;
}

