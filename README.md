# My Budget

**[EN](#-english) | [RU](#-russian)**

---

## 🇬🇧 English

This is a simplified React version of my budget tracking app ([my-budget-vue.pages.dev](https://my-budget-vue.pages.dev)). I built it as a playground to experiment with different web development tools and workflows. To speed up development, I used Cursor IDE. Data security is handled via RLS policies, and authentication is implemented through Google Auth. The project is hosted on Cloudflare Pages.

### About This Project

The app allows you to:

- **Track Income & Expenses**: Add and manage your income sources and planned expenses across different categories
- **Set Financial Goals**: Define savings goals and track your progress toward achieving them
- **Multi-Currency Support**: Work with different currencies - the app automatically converts everything to your base currency for a unified view
- **Budget Scenarios**: Create and compare multiple budget scenarios to make informed financial decisions (e.g., comparing taking a loan vs. saving up)
- **Visual Progress Tracking**: See your savings progress and how close you are to your financial goals
- **Cloud Sync**: All your data is accessible from any device

The application uses the envelope method, where you allocate money to different "envelopes" (categories) and track spending within each category to stay within your budget.

### Technologies Used

#### Core Framework
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server

#### Backend & Authentication
- **Supabase** - Backend-as-a-Service for database, authentication, and real-time features

#### State Management & Data Fetching
- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Powerful data synchronization and caching

#### Routing & Navigation
- **React Router DOM v7** - Client-side routing with protected routes

#### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful SVG icons
- **Recharts** - Composable charting library for data visualization

#### Internationalization
- **i18next** & **react-i18next** - Multi-language support (English & Russian)

#### Additional Libraries
- **react-currency-input-field** - Currency input handling
- **react-day-picker** - Date picker component
- **theme-change** - Theme switching functionality

#### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** & **Autoprefixer** - CSS processing

### Getting Started

#### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Supabase account** and project (for backend services)

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-budget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` (or the port shown in the terminal).

#### Available Scripts

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

### Project Structure

```
src/
├── app/                    # Application layout components
│   └── layout/            # Header, Sidebar, Layout components
├── features/               # Feature-specific components
│   ├── expenses/          # Expense management
│   ├── goals/             # Goal tracking
│   ├── income/            # Income management
│   ├── savings/           # Savings tracking
│   ├── scenarios/         # Budget scenarios
│   ├── settings/          # Settings management
│   └── feedback/          # User feedback
├── pages/                  # Page components
│   ├── auth/              # Authentication page
│   ├── expences/          # Expenses page
│   ├── goals/             # Goals page
│   ├── income/            # Income page
│   ├── savings/           # Savings page
│   ├── settings/          # Settings page
│   └── docs/              # Documentation page
├── shared/                 # Shared utilities and components
│   ├── constants/         # App constants (currencies, categories, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization setup
│   ├── router/            # Route guards and callbacks
│   ├── store/             # State management (Zustand stores)
│   ├── ui/                # Reusable UI components
│   └── utils/             # Utility functions
└── lib/                    # External library configurations
    └── supabase.ts        # Supabase client setup
```

### Features

#### Financial Management
- ✅ Income tracking with multiple sources
- ✅ Expense tracking by categories
- ✅ Savings account management
- ✅ Financial goals with progress tracking
- ✅ Automatic currency conversion
- ✅ Financial summary dashboard

#### User Experience
- ✅ Multi-language support (English, Russian)
- ✅ Dark/Light theme switching
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Protected routes with authentication
- ✅ Multiple budget scenarios
- ✅ Visual charts and progress indicators

#### Data & Security
- ✅ Secure authentication via Supabase
- ✅ Cloud-based data storage
- ✅ Real-time data synchronization
- ✅ Protected API routes

### Development

#### Code Style
- The project uses ESLint for code quality
- TypeScript strict mode is enabled
- Follow React best practices and hooks conventions

#### Internationalization
- Translations are stored in `src/shared/i18n/locales/`
- Supported languages: English (`en`) and Russian (`ru`)
- Use the `useTranslation` hook from `react-i18next` in components

### License

This project is private and proprietary.

### Contributing

This is a private project. For questions or suggestions, please contact the project maintainer.

---

## 🇷🇺 Russian

Это упрощенная React-версия моего приложения ([my-budget-vue.pages.dev](https://my-budget-vue.pages.dev)) для учета бюджета. Я создала её как полигон, чтобы потестировать инструменты и подходы в веб-разработке. Чтобы собрать проект быстрее, использовала Cursor IDE. За безопасность данных отвечают настроенные RLS-политики в базе, а вход реализован через Google Auth. Проект живет на Cloudflare Pages.

### О проекте

Приложение позволяет:

- **Отслеживать доходы и расходы**: Добавлять и управлять источниками дохода и запланированными расходами по различным категориям
- **Ставить финансовые цели**: Определять цели по накоплениям и отслеживать прогресс их достижения
- **Поддержка нескольких валют**: Работать с разными валютами — приложение автоматически конвертирует все в базовую валюту для единого представления
- **Сценарии бюджета**: Создавать и сравнивать несколько сценариев бюджета для принятия обоснованных финансовых решений (например, сравнение взятия кредита и накопления)
- **Визуальное отслеживание прогресса**: Видеть прогресс накоплений и насколько вы близки к своим финансовым целям
- **Облачная синхронизация**: Все ваши данные доступны с любого устройства

Приложение использует метод конвертов, где вы распределяете деньги по разным "конвертам" (категориям) и отслеживаете расходы в каждой категории, чтобы не выходить за рамки бюджета.

### Используемые технологии

#### Основной фреймворк
- **React 19** - Современный React с последними функциями
- **TypeScript** - Разработка с проверкой типов
- **Vite** - Быстрый инструмент сборки и сервер разработки

#### Бэкенд и аутентификация
- **Supabase** - Backend-as-a-Service для базы данных, аутентификации и функций в реальном времени

#### Управление состоянием и получение данных
- **Zustand** - Легковесное управление состоянием
- **TanStack Query (React Query)** - Мощная синхронизация данных и кэширование

#### Маршрутизация и навигация
- **React Router DOM v7** - Клиентская маршрутизация с защищенными маршрутами

#### Стилизация и интерфейс
- **Tailwind CSS** - CSS фреймворк на основе утилит
- **Headless UI** - Нестилизованные, доступные UI компоненты
- **Heroicons** - Красивые SVG иконки
- **Recharts** - Композиционная библиотека графиков для визуализации данных

#### Интернационализация
- **i18next** & **react-i18next** - Поддержка нескольких языков (английский и русский)

#### Дополнительные библиотеки
- **react-currency-input-field** - Обработка ввода валюты
- **react-day-picker** - Компонент выбора даты
- **theme-change** - Функциональность переключения темы

#### Инструменты разработки
- **ESLint** - Проверка кода
- **TypeScript ESLint** - Правила проверки для TypeScript
- **PostCSS** & **Autoprefixer** - Обработка CSS

### Начало работы

#### Требования

- **Node.js** (рекомендуется v18 или выше)
- **npm** или **yarn** менеджер пакетов
- **Аккаунт Supabase** и проект (для бэкенд-сервисов)

#### Установка

1. **Клонировать репозиторий**
   ```bash
   git clone <repository-url>
   cd my-budget
   ```

2. **Установить зависимости**
   ```bash
   npm install
   ```

3. **Настроить переменные окружения**
   
   Создайте файл `.env` в корневой директории с вашими учетными данными Supabase:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Запустить сервер разработки**
   ```bash
   npm run dev
   ```

   Приложение будет доступно по адресу `http://localhost:5173` (или порт, указанный в терминале).

#### Доступные скрипты

- `npm run dev` - Запустить сервер разработки с горячей заменой модулей
- `npm run build` - Собрать приложение для продакшена
- `npm run preview` - Предпросмотр продакшен-сборки локально
- `npm run lint` - Запустить ESLint для проверки качества кода

### Структура проекта

```
src/
├── app/                    # Компоненты макета приложения
│   └── layout/            # Компоненты Header, Sidebar, Layout
├── features/               # Компоненты для конкретных функций
│   ├── expenses/          # Управление расходами
│   ├── goals/             # Отслеживание целей
│   ├── income/            # Управление доходами
│   ├── savings/           # Отслеживание накоплений
│   ├── scenarios/         # Сценарии бюджета
│   ├── settings/          # Управление настройками
│   └── feedback/          # Обратная связь пользователя
├── pages/                  # Компоненты страниц
│   ├── auth/              # Страница аутентификации
│   ├── expences/          # Страница расходов
│   ├── goals/             # Страница целей
│   ├── income/            # Страница доходов
│   ├── savings/           # Страница накоплений
│   ├── settings/          # Страница настроек
│   └── docs/              # Страница документации
├── shared/                 # Общие утилиты и компоненты
│   ├── constants/         # Константы приложения (валюты, категории и т.д.)
│   ├── hooks/             # Пользовательские React хуки
│   ├── i18n/              # Настройка интернационализации
│   ├── router/            # Защита маршрутов и колбэки
│   ├── store/             # Управление состоянием (Zustand stores)
│   ├── ui/                # Переиспользуемые UI компоненты
│   └── utils/             # Утилитарные функции
└── lib/                    # Конфигурации внешних библиотек
    └── supabase.ts        # Настройка клиента Supabase
```

### Функции

#### Финансовое управление
- ✅ Отслеживание доходов из нескольких источников
- ✅ Отслеживание расходов по категориям
- ✅ Управление счетами накоплений
- ✅ Финансовые цели с отслеживанием прогресса
- ✅ Автоматическая конвертация валют
- ✅ Панель финансовой сводки

#### Пользовательский опыт
- ✅ Поддержка нескольких языков (английский, русский)
- ✅ Переключение темной/светлой темы
- ✅ Адаптивный дизайн (мобильный, планшет, десктоп)
- ✅ Защищенные маршруты с аутентификацией
- ✅ Несколько сценариев бюджета
- ✅ Визуальные графики и индикаторы прогресса

#### Данные и безопасность
- ✅ Безопасная аутентификация через Supabase
- ✅ Облачное хранение данных
- ✅ Синхронизация данных в реальном времени
- ✅ Защищенные API маршруты

### Разработка

#### Стиль кода
- Проект использует ESLint для качества кода
- Включен строгий режим TypeScript
- Следовать лучшим практикам React и соглашениям по хукам

#### Интернационализация
- Переводы хранятся в `src/shared/i18n/locales/`
- Поддерживаемые языки: английский (`en`) и русский (`ru`)
- Использовать хук `useTranslation` из `react-i18next` в компонентах
