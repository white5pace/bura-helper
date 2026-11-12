# Task: Страница «Подготовка к игре»

> Активная задача для оркестратора. Skill: `team-orchestrator`.  
> Шаблон: `src/docs/task-packet.template.md`

---

**Type:** feature

**Описание:** реализовать страницу подготовки поверх заготовки `GameStart.tsx`. Показать, кто раздаёт: первый игрок в порядке выбора на `/participants` (`selectedPlayerIds[0]`), с подписью «Раздает:» и его именем. Ниже — выбор козыря предстоящего раунда: одна радиогруппа из четырёх мастей. Форму сделать на `react-hook-form` + `zod`; без выбранной масти игру не начинать, ошибка — на русском. По кнопке «Начать игру» записать в `currentGame` выбранный козырь и id раздающего и перейти на `/game`. Если раздающего нет, не показывать пустое имя, форму и кнопку «Начать игру». `PageLayout` и `SecondHeader` на странице один раз. Сообщение вынести в `src/widgets/redirect-notice/RedirectNotice.tsx`: причина с экрана — «Не удалось определить, кто раздаёт.», дальше общая фраза со ссылкой и числом от 10 до 1 без склонения «секунд». Отдельный хук не делать: отсчёт живёт внутри компонента, он монтируется только без раздающего. Ссылка и ноль вызывают один `onLeave`: `resetGame` и переход на `/`. Тост не показывать.

Иконки для этой задачи не брать готовыми из `lucide-react` и не подменять библиотечными мастями. Это исключение из правила «иконки только из lucide» и действует только здесь. Design Implementer забирает из кадра Figma пять векторов и сохраняет их в проект как SVG: иконку рядом с подписью «Раздает:» и четыре масти в радиокнопках козыря. Радиогруппу поставить через CLI: `npx shadcn@latest add radio-group`.

**Spec:** `src/docs/spec.md` → «Подготовка к игре»  
**Todo:** `src/docs/todo.md` — расширить `currentGame` полями козыря и раздающего (строка про поля партии). Счёт в этой задаче не добавлять. Маршруты `/round-end` и `/game-end` не делать.  
**Route:** `/game-start`

**Figma:** `https://www.figma.com/design/yDMDsQFFgfIk4fIlAKVJEE/Bura-helper?node-id=459-2657&t=rLuRVXfCl51kfb0E-4`  
**Layout:** `src/docs/layouts/game-start.md`  
**Code refs:** `src/pages/GameStart.tsx`, `src/pages/Teams.tsx`, `src/pages/Participants.tsx`, `src/contexts/ParticipantsContext.tsx`, `src/lib/currentGameStorage.ts`, `src/shared/ui/PageLayout.tsx`, `src/shared/ui/SecondHeader.tsx`, `src/App.tsx`

**Out of scope:** главный экран игры, подсчёт очков и поле счёта в сессии; маршруты `/round-end` и `/game-end`; настройки партии (открытый/закрытый козырь и прочие правила); смена порядка игроков и логики выбора на `/participants` и `/teams`.

**Tests:** integration

**Sub-agents:** design-implementer → frontend-developer → reviewer → test-writer → qa-tester

**Status:** pending

---

_Запустите: «Используй skill team-orchestrator»_
