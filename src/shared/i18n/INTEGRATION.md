# Инструкция по интеграции i18n

## Шаг 1: Установка зависимостей

Установите необходимые пакеты:

```bash
npm install i18next react-i18next
```

## Шаг 2: Инициализация в main.tsx

Добавьте импорт конфигурации i18n в начало файла `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import './index.css'
import './shared/i18n/config' // Добавьте эту строку
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

## Шаг 3: Использование в компонентах

### Пример использования в компоненте:

```typescript
import { useTranslation } from '@/shared/i18n';

function MyComponent() {
  const { t } = useTranslation('pages');
  
  return (
    <div>
      <h1>{t('income.title')}</h1>
      <p>{t('income.addIncome')}</p>
    </div>
  );
}
```

### Пример использования с разными namespace:

```typescript
import { useTranslation } from '@/shared/i18n';

function MyComponent() {
  const { t: tCommon } = useTranslation('common');
  const { t: tPages } = useTranslation('pages');
  
  return (
    <div>
      <button>{tCommon('actions.save')}</button>
      <h1>{tPages('goals.title')}</h1>
    </div>
  );
}
```

## Шаг 4: Добавление переключателя языка

Используйте компонент `LanguageSwitch` в настройках или в любом месте приложения:

```typescript
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch';

function SettingsPage() {
  return (
    <div>
      <h1>Настройки</h1>
      <LanguageSwitch />
    </div>
  );
}
```

## Шаг 5: Добавление новых переводов

1. Откройте соответствующий JSON файл в `src/shared/i18n/locales/{language}/`
2. Добавьте новый ключ с переводом
3. Добавьте тот же ключ во все языковые файлы

Пример:

**ru/pages.json:**
```json
{
  "income": {
    "title": "Доходы",
    "newKey": "Новый перевод"
  }
}
```

**en/pages.json:**
```json
{
  "income": {
    "title": "Income",
    "newKey": "New translation"
  }
}
```

## Структура переводов

- `common.json` - общие переводы (кнопки, действия, ошибки, валидация)
- `pages.json` - переводы для страниц приложения
- `components.json` - переводы для UI компонентов

## Поддерживаемые языки

- `ru` - Русский (по умолчанию)
- `en` - Английский

Для добавления нового языка:
1. Создайте папку `src/shared/i18n/locales/{language}/`
2. Скопируйте структуру JSON файлов
3. Добавьте переводы
4. Обновите `config.ts` для добавления нового языка в resources
5. Добавьте язык в `hooks.ts` в массив `availableLanguages`

