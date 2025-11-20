/**
 * Типы для i18n
 */

export type Language = 'ru' | 'en';

export type Namespace = 'common' | 'pages' | 'components';

export interface TranslationResources {
  ru: Record<Namespace, Record<string, any>>;
  en: Record<Namespace, Record<string, any>>;
}

