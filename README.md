# Бур-Козёл Helper

Веб-приложение-помощник для карточной игры **«Бур-Козёл»**. Мобильный-first: им пользуются прямо за столом с телефона.

Приложение берёт на себя всю «бухгалтерию» партии, чтобы игрокам не приходилось держать её в голове:

- помнит, **кто раздаёт** и **какой сейчас козырь**;
- ведёт **счёт команд по раундам** и штрафные очки;
- хранит **ростер игроков** и **названия команд** между партиями;
- в планах — общая **статистика по командам** (победы, даты).

Серверного бэкенда нет: всё состояние живёт в `localStorage` браузера, ничего никуда не отправляется.

---

## Что уже работает

| Маршрут | Экран | Состояние |
|---|---|---|
| `/` | Главный экран (меню) | «Начать новую игру» сбрасывает сессию; «Продолжить» — заглушка |
| `/participants` | Выбор игроков | Готово: список, выбор чекбоксами, switch «Командный режим», лимит 4, toast-валидация |
| `/participants/player/:id?` | Добавление и редактирование игрока | Готово: валидация имени (мин. 2 символа, уникальность) |
| `/teams` | Названия команд | Готово: `react-hook-form` + `zod`, предзаполнение, ошибки по макету |
| `/game-start` | Подготовка к игре | Заглушка |

Экраны самой игры (`/game`, `/round-end`, `/game-end`), козырь, раздающий и счёт пока не реализованы — это ближайший P1.

---

## Стек

| Слой | Технология |
|---|---|
| UI | React 19 + TypeScript |
| Сборка | Vite |
| Стили | Tailwind CSS 4 |
| Компоненты | shadcn/ui |
| Иконки | lucide-react |
| Маршрутизация | react-router-dom |
| Формы | react-hook-form + zod |
| Состояние | React Context |
| Хранение | localStorage |
| Тесты | Vitest + Testing Library |

Требуется **Node.js 22.12+** (или 20.19+).

---

## Быстрый старт

```bash
npm install
npm run dev
```

| Команда | Что делает |
|---|---|
| `npm run dev` | Дев-сервер Vite с HMR |
| `npm run build` | `tsc -b` + production-сборка |
| `npm run preview` | Локальный просмотр собранной версии |
| `npm test` | Прогон всех тестов один раз |
| `npm run test:watch` | Тесты в watch-режиме |
| `npm run lint` | ESLint |

Покрытие считается через `@vitest/coverage-v8`:

```bash
npx vitest run --coverage
```

Отчёт складывается в `coverage/` и в git не попадает.

---

## Структура проекта

```
src/
├── components/ui/   # shadcn-примитивы (ставятся только через CLI)
├── contexts/        # глобальное состояние: ParticipantsContext
├── docs/            # спеки, layout-спеки, текущая задача
├── layouts/         # MainLayout — общий каркас страниц
├── lib/             # storage-модули, правила игры, утилиты
├── pages/           # страницы приложения
├── shared/ui/       # переиспользуемые компоненты проекта
└── test/            # setup и renderWithProviders
```

Ключевые модули логики — в `src/lib/`:

- `playerStorage.ts`, `teamStorage.ts`, `currentGameStorage.ts` — чтение/запись и валидация через zod;
- `teamPair.ts` — нормализация пары игроков и upsert команды;
- `ensureTeamsForSelection.ts` — сборка команд по выбору игроков;
- `gameRules.ts` — игровые константы вроде размера командного режима.

---

## Данные в localStorage

| Ключ | Что хранит | Живёт |
|---|---|---|
| `players` | Ростер игроков | Постоянно |
| `teams` | Каталог команд (пары игроков + названия) | Постоянно |
| `currentGame` | Сессия партии: `selectedPlayerIds`, `teamMode`, `currentTeamIds` | До «Начать новую игру» |

`resetGame()` обнуляет только `currentGame` — игроки и команды остаются. Удаление игрока удаляет и команды, в которых он состоял.

---

## Документация

| Файл | О чём |
|---|---|
| [`src/docs/spec.md`](src/docs/spec.md) | Продуктовая спека: экраны и требования по приоритетам |
| [`src/docs/tech.md`](src/docs/tech.md) | Техническая спека: стек, правила, storage, тесты |
| [`src/docs/todo.md`](src/docs/todo.md) | Открытый P1, которого нет в спеке |
| [`src/docs/layouts/`](src/docs/layouts) | Layout-спеки экранов для реализации |
| [`src/docs/tasks/current.md`](src/docs/tasks/current.md) | Активная задача |

Проект ведётся через sub-agents Cursor: роли и pipeline описаны в [`.cursor/agents/`](.cursor/agents), правила — в [`.cursor/rules/project.mdc`](.cursor/rules/project.mdc).

---

## Правила разработки

- UI — только shadcn/ui. Новые примитивы ставятся CLI: `npx shadcn@latest add <component>`, не копируются руками.
- Глобальное состояние — только React Context, без Redux/Zustand/Jotai.
- Формы — `react-hook-form` + `zod`, сообщения об ошибках и весь интерфейс — на русском.
- Минимальный diff: не рефакторить несвязанный код в рамках задачи.

---

## Известные проблемы

- `npm run build` падает на `TS5101`: deprecated `baseUrl` в `tsconfig.app.json`.
- `npm run lint` даёт ошибки `react-refresh/only-export-components` в `button.tsx`, `tabs.tsx`, `toast.tsx` и `ParticipantsContext.tsx` — примитивы и контекст экспортируют не только компоненты.

Оба пункта заведены в [`src/docs/todo.md`](src/docs/todo.md).
