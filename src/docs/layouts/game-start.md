# Layout: game-start

> Упрощённая компоновка для Frontend Developer, Reviewer и QA Tester.  
> Создаёт и обновляет **только Design Implementer** (единственная роль с Figma MCP).  
> Не дублировать product spec (`src/docs/spec.md` → «Подготовка к игре»).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body (vertical, flex-1):
   │  ├─ SecondHeader: «Подготовка к игре»
   │  └─ Content (vertical, gap-4, flex-1)
   │     ├─ DealerBlock (vertical, gap-3)
   │     │  ├─ DealerLabel (horizontal, items-center, gap-2)
   │     │  │  ├─ img src/assets/dealer.svg
   │     │  │  └─ текст «Раздает:»
   │     │  └─ имя раздающего
   │     │     — если раздающего нет, блок раздающего, форму и футер не рендерить; вместо них `RedirectNotice`.
   │     └─ Form
   │        └─ Field (vertical, gap-3)
   │           ├─ FieldLabel: «Козырь»
   │           ├─ RadioGroup (horizontal, items-center, gap-4)
   │           │  └─ Label (horizontal, items-center, gap-2) × 4
   │           │     ├─ RadioGroupItem
   │           │     └─ img масти
   │           └─ FieldError — только в invalid-состоянии
   └─ footer: Button «Начать игру» (full width)
```

Порядок мастей в группе: крести, пики, черви, буби. В кадре выбранная точка показана на «крести» — это пример состояния `checked`, не начальное значение.

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| PageLayout body | vertical | — | full | — |
| SecondHeader | horizontal | — | full | — |
| Content | vertical | gap-4 | full | — |
| DealerBlock | vertical | gap-3 | shrink | — |
| DealerLabel | horizontal | gap-2 | shrink | — |
| Form | vertical | — | full | — |
| Field | vertical | gap-3 | full | — |
| RadioGroup | horizontal | gap-4 | shrink | — |
| Suit option (Label) | horizontal | gap-2 | shrink | — |
| Footer | — | — | full | — |

Шапка «БурКозел» — это `MainLayout`, не блок этой страницы. Отступ под `SecondHeader` уже в компоненте.

## Компоненты

- `@/shared/ui/PageLayout`, `SecondHeader` — заголовок «Подготовка к игре»
- `@/components/ui/field` — `Field`, `FieldLabel`, `FieldError`
  - invalid-состояние: `Field data-invalid`, `RadioGroupItem aria-invalid`
  - `FieldError` сразу под `RadioGroup`
- `@/components/ui/label` — обёртка пункта масти (дефолтные `flex items-center gap-2`). Подпись «Козырь» — `FieldLabel`, не этот `Label`
- `@/components/ui/radio-group` — поставлен CLI, отдельных variant нет
  - `RadioGroup`: props Base UI (`value`, `defaultValue`, `onValueChange`, `name`, `disabled`, `required`, `form`). На странице `className` с горизонтальным рядом (`flex flex-row items-center gap-4 w-auto`) — перекрывает дефолт `grid w-full gap-2`
  - `RadioGroupItem`: обязательный `value`. Круг с обводкой; в `checked` внутри точка `primary`. Заливки круга в selected нет
  - `value` по порядку: `крести`, `пики`, `черви`, `буби`
- `@/components/ui/button` — footer: `variant="outline"`, `size="lg"`, `className="w-full"`; submit связан с формой через `form`
- SVG (исключение: не lucide, файлы не переписывать, корневые `width`/`height` не менять):
  - `src/assets/dealer.svg` — знак рядом с «Раздает:». Обёртка `shrink-0 object-contain` того же размера, что `RadioGroupItem`. Не растягивать на всю строку
  - `src/assets/suit-clubs.svg` — крести, `alt="крести"`
  - `src/assets/suit-spades.svg` — пики, `alt="пики"`
  - `src/assets/suit-hearts.svg` — черви, `alt="черви"`
  - `src/assets/suit-diamonds.svg` — буби, `alt="буби"`
  - масти: `shrink-0`, собственный размер файла, сразу после своей радиокнопки

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
