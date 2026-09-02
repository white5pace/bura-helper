# Task Packet

> Шаблон входа от **Team Lead**. Копируйте в `src/docs/tasks/current.md` или передавайте orchestrating-агенту.

---

## Task: <название>

**Type:** feature | design | infra | cleanup

**Описание:** что нужно сделать в рамках этой задачи (свободный текст)

**Spec:** `src/docs/pages/<page>.md`  
**Todo:** `todo.md` → §<N>, пункты: ...  
**Route:** `/path`

**Figma:** `<url>` | `none`  
→ если есть: только для Design Implementer / Design Tester

**Layout:** `src/docs/layouts/<page>.md` | `pending`  
→ `pending` = сначала Design Implementer, потом Frontend Developer

**Code refs:** файлы-эталоны (например `src/pages/Player.tsx`)

**Out of scope:** что НЕ трогать

**Tests:** unit | integration | none

**Sub-agents:** design-implementer → frontend-developer → reviewer → test-writer → qa-tester → [design-tester]

**Task file:** скопировать в `src/docs/tasks/current.md` и запустить skill `team-orchestrator`

---

## Чеклист Team Lead

- [ ] Описание задачи заполнено
- [ ] Spec-страница указана
- [ ] Пункты todo — конкретная секция, не весь файл
- [ ] Figma или явно `none`
- [ ] Out of scope заполнен
- [ ] Решено: нужен ли Design Implementer до Frontend Developer
- [ ] Sub-agents перечислены по pipeline
