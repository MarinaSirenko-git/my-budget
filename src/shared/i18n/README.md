# i18n (Интернационализация)

Эта папка содержит конфигурацию и файлы переводов для интернационализации приложения.

## Структура

```
i18n/
├── config.ts              # Конфигурация i18next
├── hooks.ts               # React хуки для работы с переводами
├── types.ts               # TypeScript типы
├── index.ts               # Экспорты модуля
└── locales/               # Файлы переводов
    ├── ru/                # Русский язык
    │   ├── common.json    # Общие переводы
    │   ├── pages.json     # Переводы для страниц
    │   └── components.json # Переводы для компонентов
    └── en/                # Английский язык
        ├── common.json
        ├── pages.json
        └── components.json
```

## Использование

### Инициализация

Импортируйте конфигурацию i18n в `main.tsx`:

```typescript
import './shared/i18n/config';
```

### Использование в компонентах

```typescript
import { useTranslation } from '@/shared/i18n';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('app.name')}</h1>;
}
```

### Переключение языка

```typescript
import { useLanguage } from '@/shared/i18n';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  return (
    <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
      {availableLanguages.map(lng => (
        <option key={lng} value={lng}>{lng}</option>
      ))}
    </select>
  );
}
```

### Пространства имен (Namespaces)

- `common` - общие переводы (действия, ошибки, валидация)
- `pages` - переводы для страниц
- `components` - переводы для компонентов

### Добавление новых переводов

1. Добавьте ключ в соответствующий JSON файл
2. Добавьте перевод для всех языков (ru, en)
3. Используйте через `t('namespace.key')` или `t('namespace.nested.key')`

### Примеры

```typescript
// Использование с namespace
const { t } = useTranslation('pages');
t('income.title'); // "Доходы" или "Income"

// Использование с параметрами
const { t } = useTranslation('common');
t('validation.minLength', { min: 5 }); // "Минимальная длина: 5"
```

