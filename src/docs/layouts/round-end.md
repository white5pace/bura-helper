# Layout: round-end

> Упрощённая компоновка для Frontend Developer, Reviewer и QA Tester.  
> Создаёт и обновляет **только Design Implementer** (единственная роль с Figma MCP).  
> Не дублировать product spec (`src/docs/spec.md` → «Завершение раунда»).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body (vertical, flex-1, min-h-0):
   │  ├─ SecondHeader (horizontal, items-center)
   │  │  ├─ title: «Штрафные очки за раунд»
   │  │  └─ actions: Button (ghost, icon, iconSize lg) — один режим на весь список
   │  └─ Content (vertical, gap-4, flex-1, text-left)
   │     ├─ PenaltyRow (Field, vertical, gap-3) × N
   │     │  ├─ FieldLabel: «{имя} ({сумма})»
   │     │  └─ режим радиокнопок:
   │     │     └─ RadioGroup (horizontal, items-center, gap-4)
   │     │        └─ Label (horizontal, items-center, gap-2) × 6
   │     │           ├─ RadioGroupItem
   │     │           └─ текст «0» | «2» | «4» | «6» | «8» | «12»
   │     │     — либо режим числа, вместо этой RadioGroup:
   │     │        └─ Input type="number"
   │     └─ TrumpField (Field, vertical, gap-3)
   │        ├─ FieldLabel: «Козырь»
   │        └─ RadioGroup (horizontal, items-center, gap-4)
   │           └─ Label (horizontal, items-center, gap-2) × 4
   │              ├─ RadioGroupItem
   │              └─ img масти
   └─ footer: Button «Продолжить» или «Закончить» (full width)
```

Шапка «БурКозел» — это `MainLayout`, не блок этой страницы. Отступ под ней уже в `AppHeader`. Отступ под `SecondHeader` уже в компоненте. Кнопка футера прижата к низу через `footer` у `PageLayout`.

Строка одна и та же для команды и для игрока. В командном режиме имя — название команды, иначе имя игрока. Подпись: имя, пробел, сумма в скобках. Сумма — текущие очки плюс штрафные, выбранные на этом экране. Пример кадра: «Ананасовый кол (10)».

Режим один на весь список. Стартовый кадр — радиокнопки.

- Радиокнопки: в шапке `SquarePen`. У каждой строки своя `RadioGroup` со значениями по порядку `0`, `2`, `4`, `6`, `8`, `12`. `Input` не рендерится.
- Число: в шапке `CopyCheck`. У каждой строки `Input type="number"`. `RadioGroup` штрафных не рендерится. Блок «Козырь» остаётся радиокнопками мастей.

Если сумма строки `>= 12`, класс `text-team` стоит только на `FieldLabel` этой строки. Радиокнопки и поле ввода не красятся.

Блок «Козырь» есть в дереве, пока каждая сумма `< 12`. Когда хотя бы одна сумма `>= 12`, блок не рендерится.

Футер: «Продолжить», пока блок «Козырь» на экране. «Закончить», когда блока нет. Выбранные в кадре значения (штраф `0` или `2`, козырь «крести») — пример состояния, не начальное значение страницы.

Порядок мастей: крести, пики, черви, буби. Разметка блока «Козырь» совпадает с `/game-start`.

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| PageLayout body | vertical | — | full | — |
| SecondHeader | horizontal | — | full | — |
| Content | vertical | gap-4 | full, flex-1 | — |
| PenaltyRow | vertical | gap-3 | full | — |
| RadioGroup штрафных | horizontal | gap-4 | full | — |
| Пункт штрафных (Label) | horizontal | gap-2 | shrink-0 | — |
| Input | — | — | full | — |
| TrumpField | vertical | gap-3 | full | — |
| RadioGroup козыря | horizontal | gap-4 | shrink | — |
| Пункт масти (Label) | horizontal | gap-2 | shrink | — |
| Footer | — | — | full | — |

`Content` с `text-left`: у `#root` текст по центру, а подписи строк на всю ширину.

`gap-2` у `Label` — дефолт компонента, в `className` его не задавать.

## Компоненты

- `@/shared/ui/PageLayout`, `SecondHeader` — заголовок «Штрафные очки за раунд». Кнопку режима класть в `actions`
- `@/components/ui/button`
  - режим: `type="button"`, `variant="ghost"`, `size="icon"`, `iconSize="lg"`, `className="ml-auto"`. Подписи на кнопке нет. Размер иконки задаёт `iconSize`, на саму иконку `className` не вешать
    - радиокнопки: `SquarePen` из `lucide-react`, `aria-label="Ввод числом"`
    - число: `CopyCheck` из `lucide-react`, `aria-label="Радиокнопки"`
  - footer: `variant="outline"`, `size="lg"`, `className="w-full"`
- `@/components/ui/field` — `Field`, `FieldLabel`
  - `PenaltyRow` и `TrumpField`: `Field` с `className="gap-3"`
  - подпись строки и «Козырь»: `FieldLabel` без классов типографики. При сумме `>= 12` у подписи строки `className="text-team"`. `data-invalid` для этой подсветки не ставить
- `@/components/ui/label` — пункт штрафных и пункт масти, дефолтные `flex items-center gap-2`. Подпись строки и «Козырь» — `FieldLabel`, не этот `Label`
  - пункт штрафных: `className="shrink-0"`
  - пункт масти: без `className`
- `@/components/ui/radio-group` — отдельных variant нет
  - штрафные: `className="flex w-full flex-row items-center gap-4"`. Своя группа на каждую строку. Перекрывает дефолт `grid w-full gap-2`
  - козырь: `className="flex w-auto flex-row items-center gap-4"`
  - `RadioGroupItem`: обязательный `value`. Круг с обводкой; в выбранном состоянии точка `primary`. Заливки круга нет
  - `value` штрафных: `0`, `2`, `4`, `6`, `8`, `12`
  - `value` козыря: `крести`, `пики`, `черви`, `буби`
- `@/components/ui/input` — только режим числа, `type="number"`, без `className`. Цвет поля при `text-team` у подписи не меняется
- Масти (файлы не переписывать, размер из SVG не задавать). Именованный экспорт из `src/assets/icons/index.ts`:
  - `крести` → `clubs`, `alt="крести"`
  - `пики` → `spades`, `alt="пики"`
  - `черви` → `hearts`, `alt="черви"`
  - `буби` → `diamonds`, `alt="буби"`
  - `img`: `className="shrink-0"`, сразу после своей радиокнопки

## Сборка страницы

Страницу собирает Frontend Developer. `RoundEnd.tsx` этим макетом не создаётся.

Режим радиокнопок, все суммы `< 12`:

```tsx
<PageLayout
  footer={
    <Button variant="outline" size="lg" className="w-full">
      Продолжить
    </Button>
  }
>
  <SecondHeader
    actions={
      <Button
        type="button"
        variant="ghost"
        size="icon"
        iconSize="lg"
        className="ml-auto"
        aria-label="Ввод числом"
      >
        <SquarePen />
      </Button>
    }
  >
    Штрафные очки за раунд
  </SecondHeader>
  <div className="flex flex-1 flex-col gap-4 text-left">
    <Field className="gap-3">
      <FieldLabel>Ананасовый кол (10)</FieldLabel>
      <RadioGroup className="flex w-full flex-row items-center gap-4">
        <Label className="shrink-0">
          <RadioGroupItem value="0" />0
        </Label>
        {/* 2, 4, 6, 8, 12 — тем же Label */}
      </RadioGroup>
    </Field>
    <Field className="gap-3">
      <FieldLabel>Козырь</FieldLabel>
      <RadioGroup className="flex w-auto flex-row items-center gap-4">
        <Label>
          <RadioGroupItem value="крести" />
          <img src={clubs} alt="крести" className="shrink-0" />
        </Label>
        {/* пики, черви, буби */}
      </RadioGroup>
    </Field>
  </div>
</PageLayout>
```

Режим числа — тот же каркас. В `actions` иконка `CopyCheck` и `aria-label="Радиокнопки"`. В строке вместо `RadioGroup` штрафных:

```tsx
<Input type="number" />
```

Сумма `>= 12`: у этой `FieldLabel` добавить `text-team`, блок «Козырь» не рендерить, подпись футера — «Закончить».

## Не включать

- Цвета, px, шрифты, border-radius — это в UI primitives (`components/ui/`)
- Бизнес-логику и валидацию — это в product spec
