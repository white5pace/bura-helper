# Техническая спецификация

Правила и стек для проекта **Бур-Козёл Helper**. Продуктовые требования — в [spec.md](./spec.md).

---

## Стек

| Слой | Технология |
|------|------------|
| UI | **React 19** + **TypeScript** |
| Сборка | **Vite** |
| Стили | **Tailwind CSS 4** |
| Компоненты | **shadcn/ui** (обязательно) |
| Иконки | **lucide-react** |
| Маршрутизация | **react-router-dom** |
| Формы | **react-hook-form** + **zod** |
| Хранение данных | **localStorage** (обязательно) |
| Состояние | **React Context** (обязательно) |

---

## Состояние приложения

- Глобальное состояние — только через **React Context** (`src/contexts/`).
- **Не использовать** сторонние сторы: Redux, Zustand, Jotai, MobX, Recoil и аналоги.
- Локальное UI-состояние страницы — `useState` / `useReducer`.
- Состояние форм — **react-hook-form** (локально для формы, не глобальный стор).
- Персистентность — Context + `localStorage`, по образцу `ParticipantsContext`.

---

## UI и компоненты

- Все базовые элементы интерфейса — из **shadcn/ui** (`src/components/ui/`).
- Новые UI-примитивы добавлять через shadcn CLI, не писать с нуля аналоги Button, Input, Checkbox и т.д.
- Кастомные компоненты проекта — в `src/shared/ui/`; страницы — в `src/pages/`.
- Импорты UI: `@/components/ui/...`, утилиты: `@/lib/utils`.
- Иконки — только из `lucide-react`.

---

## Данные и localStorage

- Серверного бэкенда нет; всё состояние приложения хранится в **localStorage**.
- Ключи хранения — константы в одном месте (контекст или модуль storage), например: `players`, `currentGame`.
- Чтение при инициализации, запись при изменении данных (`useEffect` или централизованный слой).
- При ошибке парсинга JSON — fallback на пустое значение, без падения приложения.
- Типы данных описывать в TypeScript-интерфейсах; не полагаться на «сырой» JSON без проверки.

---

## Формы и валидация

- Формы — **react-hook-form** с резолвером **zod**.
- Схемы валидации — рядом со страницей или в отдельном файле схем; сообщения об ошибках — на **русском языке**.
- Ошибки полей — через компоненты shadcn (`Field`, `FieldError`).

---

## Маршрутизация

- Маршруты объявляются в `App.tsx` через `createBrowserRouter`.
- Общая обёртка страниц — `MainLayout`.
- Параметры маршрута (`:id?`) — для режимов создания и редактирования на одной странице.

---

## Структура проекта

```
src/
├── components/ui/   # shadcn-компоненты
├── contexts/        # React Context + localStorage
├── docs/            # спецификации
├── layouts/         # layout-компоненты
├── lib/             # утилиты (cn и пр.)
├── pages/           # страницы приложения
├── test/            # setup и helpers для Vitest
└── shared/ui/       # переиспользуемые компоненты проекта
```

---

## Тестирование

| Тип | Инструмент | Кто пишет |
|-----|------------|-----------|
| Unit | Vitest | Test Writer |
| Integration | Vitest + Testing Library | Test Writer |
| E2E | Playwright (позже) | отдельная роль |

- Запуск: `npm test`, watch: `npm run test:watch`
- Setup: `src/test/setup.ts` — мок localStorage, cleanup
- Helpers: `src/test/render.tsx` — `renderWithProviders` (Router + Context)
- Файлы тестов: `src/**/*.test.ts`, `src/**/*.test.tsx`
- Sub-agent: [test-writer.md](./agents/test-writer.md)

---

## Язык и UX

- Интерфейс и тексты ошибок — **на русском**.
- Мобильный-first: приложение рассчитано на использование за карточным столом с телефона.

---

## Код

- TypeScript strict; без `any`, если можно обойтись.
- ESLint — перед коммитом/PR прогонять `npm run lint`.
- Минимальный diff: не рефакторить и не менять несвязанный код в рамках задачи.
- Следовать уже принятому в репозитории стилю (именование, структура файлов, паттерны контекста).

---

## Вне scope (пока)

- Backend, база данных, авторизация.
- Синхронизация между устройствами.
- PWA / offline-first beyond localStorage.
