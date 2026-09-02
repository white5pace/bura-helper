# Layout: <page>

> Упрощённая компоновка для Frontend Developer.  
> Создаёт и обновляет **Design Implementer** при работе с Figma.  
> Не дублировать product spec (`src/docs/pages/<page>.md`).

## Структура (дерево блоков)

```
PageLayout
└─ footer: Button «...» (full width)
└─ body:
   ├─ SecondHeader: «...»
   └─ FieldGroup (vertical, gap-3)
      └─ Field (vertical): Label + Input
```

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| ... | vertical / horizontal | gap-3 | full | sm: stack |

## Компоненты

- `@/components/ui/button` — variant `...`
- `@/shared/ui/PageLayout`, `SecondHeader`
- ...

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
