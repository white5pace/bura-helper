# Layout: teams

> Упрощённая компоновка для Frontend Developer, Reviewer и QA Tester.  
> Создаёт и обновляет **только Design Implementer** (единственная роль с Figma MCP).  
> Не дублировать product spec (`src/docs/spec.md` → «Названия команд»).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body (vertical, flex-1)
   │  ├─ SecondHeader: «Команды»
   │  └─ Form
   │     └─ FieldGroup (vertical, gap-4)
   │        ├─ Field (vertical)
   │        │  ├─ FieldLabel: название поля + имена игроков чёрной команды
   │        │  ├─ Input
   │        │  └─ FieldError — только в invalid-состоянии
   │        └─ Field (vertical)
   │           ├─ FieldLabel: название поля + имена игроков красной команды
   │           ├─ Input
   │           └─ FieldError — только в invalid-состоянии
   └─ footer: Button «Продолжить» (full width)
```

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| PageLayout body | vertical | — | full | — |
| SecondHeader | horizontal | — | full | — |
| Form | vertical | — | full | — |
| FieldGroup | vertical | gap-4 | full | — |
| Field | vertical | component default | full | — |
| Footer | — | — | full | — |

## Компоненты

- `@/shared/ui/PageLayout`, `SecondHeader` — заголовок страницы «Команды»
- `@/components/ui/field` — `Field`, `FieldGroup`, `FieldLabel`, `FieldError`
  - invalid-состояние: `Field data-invalid`, `Input aria-invalid`
  - `FieldError` располагается сразу под соответствующим `Input`
- `@/components/ui/input` — обычный `Input`, full width; отдельный `id` для каждого поля
- `@/components/ui/button` — footer: `variant="outline"`, `size="lg"`, `className="w-full"`; submit связан с формой через `form`

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
