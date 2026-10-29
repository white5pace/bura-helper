# Task: Страница «Команды»

> Активная задача для оркестратора. Skill: `team-orchestrator`.  
> Шаблон: `src/docs/task-packet.template.md`

---

**Type:** feature

**Описание:** реализовать страницу именования команд поверх существующей заготовки `Teams.tsx`. Показать два поля для чёрной и красной команд с именами соответствующих игроков в подписях. Состав определить по порядку выбора: чёрные — игроки №1 и №3, красные — №2 и №4. Предзаполнить названия в формате `Имя1 + Имя2` и сразу сохранить значения по умолчанию в `localStorage`. Форму реализовать на `react-hook-form` + `zod`; каждое название должно содержать минимум 3 символа. Ошибки и invalid-состояния должны соответствовать макету. По кнопке «Продолжить» сохранить введённые названия для следующих экранов и перейти на `/game-start`. Если необходимые выбранные игроки отсутствуют, не показывать некорректную форму и безопасно вернуть пользователя на `/participants`.

**Spec:** `src/docs/spec.md` → «Названия команд»  
**Todo:** нет (P1 экрана в spec)  
**Route:** `/teams`

**Figma:** `https://www.figma.com/design/yDMDsQFFgfIk4fIlAKVJEE/Bura-helper?node-id=459-2750&t=5QuByxDrPXhjKbQ9-4`  
**Layout:** `pending`  
**Code refs:** `src/pages/Teams.tsx`, `src/pages/Player.tsx`, `src/pages/Participants.tsx`, `src/contexts/ParticipantsContext.tsx`, `src/shared/ui/PageLayout.tsx`, `src/shared/ui/SecondHeader.tsx`, `src/App.tsx`

**Out of scope:** реализация страниц `/game-start` и `/game`; `GameContext`, игровой процесс и подсчёт очков; изменение логики выбора и состава игроков на `/participants`; генерация или подсказки названий команд из P4/«Фантазия».

**Tests:** integration

**Sub-agents:** design-implementer → frontend-developer → reviewer → test-writer → qa-tester

**Status:** pending

---

_Запустите: «Используй skill team-orchestrator»_
