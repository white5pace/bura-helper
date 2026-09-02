# Layout: participants

> Упрощённая компоновка для Frontend Developer.  
> Создаёт и обновляет **Design Implementer** при работе с Figma.  
> Не дублировать product spec (`src/docs/pages/participants.md`).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body:
   │  ├─ SecondHeader (horizontal)
   │  │  ├─ title: «Выберите участников»
   │  │  └─ actions: Button (icon, secondary) + PlusIcon
   │  ├─ ToolbarRow (horizontal) [план]
   │  │  ├─ Switch + Label «Командный режим»
   │  │  └─ SelectionCounter (ml-auto) «N из 4»
   │  └─ FieldSet
   │     └─ FieldGroup (vertical, gap-3)
   │        ├─ EmptyState (text muted) — если список пуст
   │        └─ PlayerRow (Field horizontal) × N
   │           ├─ NumberedCheckbox
   │           ├─ FieldLabel (имя игрока)
   │           └─ RowActions (horizontal, ml-auto)
   │              ├─ Button (ghost, icon-lg, iconSize lg) + PencilIcon
   │              └─ Button (ghost, icon-lg, iconSize lg) + Trash2Icon
   └─ footer: Button «Продолжить» (full width) [план]
```

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| SecondHeader | horizontal | — | full | — |
| ToolbarRow | horizontal | gap-3 | full | — |
| FieldGroup | vertical | gap-3 | full | — |
| PlayerRow | horizontal | — | full | — |
| RowActions | horizontal | — | shrink-0 | — |
| Footer button | — | — | full | — |

## Компоненты

- `@/components/ui/button` — добавление: `variant="secondary"`, `size="icon"`; строка: `variant="ghost"`, `size="icon-lg"`, `iconSize="lg"`; footer [план]: `size="lg"`, `className="w-full"`
- `@/components/ui/numbered-checkbox` — чекбокс с порядковым номером
- `@/components/ui/field` — `Field`, `FieldGroup`, `FieldLabel`, `FieldSet`
- `@/components/ui/switch` — командный режим [план]
- `@/shared/ui/PageLayout`, `SecondHeader`
- `@/shared/ui/DeleteConfirmDialog` — подтверждение удаления (overlay, не в дереве страницы)

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
