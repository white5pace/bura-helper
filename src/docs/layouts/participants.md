# Layout: participants

> Упрощённая компоновка для Frontend Developer.  
> Создаёт и обновляет **Design Implementer** при работе с Figma.  
> Не дублировать product spec (`src/docs/pages/participants.md`).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body (vertical, gap-6, flex-1):
   │  ├─ SecondHeader (horizontal, justify-between)
   │  │  ├─ title: «Выберите участников»
   │  │  └─ actions: Button (icon, secondary) + PlusIcon
   │  └─ Content (vertical, gap-4, flex-1)
   │     ├─ ToolbarRow (horizontal, items-center)
   │     │  ├─ SwitchControl (horizontal, items-center, gap-2)
   │     │  │  ├─ Switch
   │     │  │  └─ Label «Командный режим»
   │     │  └─ SelectionCounter (ml-auto) «N из 4»
   │     │     — только при включённом Switch; иначе не рендерить
   │     └─ FieldSet
   │        └─ FieldGroup (vertical, gap-4)
   │           ├─ EmptyState (text muted) — если список пуст
   │           └─ PlayerRow (Field horizontal, gap-3) × N
   │              ├─ NumberedCheckbox
   │              ├─ FieldLabel (имя игрока)
   │              └─ RowActions (horizontal, ml-auto)
   │                 ├─ Button (ghost, icon-lg, iconSize lg) + PencilIcon
   │                 └─ Button (ghost, icon-lg, iconSize lg) + Trash2Icon
   └─ footer: Button «Продолжить» (full width)
```

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| PageLayout body | vertical | gap-6 | full | — |
| SecondHeader | horizontal | — | full | — |
| Content | vertical | gap-4 | full | — |
| ToolbarRow | horizontal | — | full | — |
| SwitchControl | horizontal | gap-2 | shrink | — |
| FieldGroup | vertical | gap-4 | full | — |
| PlayerRow | horizontal | gap-3 | full | — |
| RowActions | horizontal | — | shrink-0 | — |
| Footer | — | — | full | — |

## Компоненты

- `@/shared/ui/PageLayout`, `SecondHeader` — заголовок страницы не выносить: Figma `layout-heaer` = `SecondHeader` (title + optional `actions`)
- `@/components/ui/button` — добавление: `variant="secondary"`, `size="icon"`; строка: `variant="ghost"`, `size="icon-lg"`, `iconSize="lg"`; footer: `variant="outline"`, `size="lg"`, `className="w-full"`
- `@/components/ui/switch` — `size="default"` (Figma); рядом `Label` «Командный режим»
- `@/components/ui/label` — подпись свитча
- `@/components/ui/numbered-checkbox` — `orderNumber`, `tone="default" | "team"`, нативный `disabled`
  - командный режим: №1 и №3 → `tone="default"`; №2 и №4 → `tone="team"` (через одного)
  - без командного режима: всегда `tone="default"`
  - невыбранные: `disabled`, когда выбран лимит (4)
- `@/components/ui/field` — `Field`, `FieldGroup`, `FieldLabel`, `FieldSet`
- `@/components/ui/toast` — overlay над footer; `type="error"`, иконка `OctagonX` уже в примитиве
- `@/shared/ui/DeleteConfirmDialog` — подтверждение удаления (overlay, не в дереве страницы)

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
