# Layout: game

> Упрощённая компоновка для Frontend Developer, Reviewer и QA Tester.  
> Создаёт и обновляет **только Design Implementer** (единственная роль с Figma MCP).  
> Не дублировать product spec (`src/docs/spec.md` → «Игра»).

## Структура (дерево блоков)

```
MainLayout (shell)
└─ PageLayout
   ├─ body (vertical, flex-1, min-h-0):
   │  └─ GameCard (relative, flex-1, full width)
   │     ├─ обводка поля — слой GameCard, на всю площадь поля
   │     ├─ козырь — absolute, центр поля
   │     ├─ slot1 — absolute, нижний правый угол
   │     │  └─ PlayerCard align="end"
   │     ├─ slot2 — absolute, нижний левый угол
   │     │  └─ PlayerCard align="start"
   │     ├─ slot3 — absolute, верхний левый угол, обёртка rotate-180
   │     │  └─ PlayerCard align="end"
   │     └─ slot4 — absolute, верхний правый угол, обёртка rotate-180
   │        └─ PlayerCard align="start"
   └─ footer: Button «Завершить раунд» (full width)
```

Шапка «БурКозел» — это `MainLayout`, не блок этой страницы. Отступ под шапкой уже в `MainLayout`. Нижний отступ поля до кнопки уже в `GameCard`.

`PlayerCard` абсолютно лежит на `GameCard` через слот. Обводка принадлежит полю. Внутри `PlayerCard` два прямоугольника лежат поверх этой обводки и закрывают её на внешнем углу слота. С названием команды и без него высота прямоугольников разная; цвет и размеры — в стилях карточки. Поворот слотов 3 и 4 переносит прямоугольники на верхний внешний угол вместе с карточкой.

Дальняя сторона стола — слоты 3 и 4: их переворачивает обёртка слота, саму `PlayerCard` дополнительно не вращать. Ближняя сторона — слоты 1 и 2, без поворота.

```
slot3  rotate-180  align end     slot4  rotate-180  align start
                        козырь
slot2  align start               slot1  align end
```

Пустой слот не рисуется. Оставшиеся карточки остаются в своих углах.

## Рассадка

`GameCard` принимает список `{ id, name }` в порядке `selectedPlayerIds` и сам ставит цвет, подпись команды, счёт, углы и `align`. Игроки идут справа налево, снизу вверх. Если игроков двое, второй садится в левый верхний угол, а не в левый нижний. Пустой угол не рисуется. Обёртка слотов 3 и 4 уже переворачивает карточку, `PlayerCard` дополнительно не вращать.

## Правила компоновки

| Блок | Direction | Gap | Width | Breakpoint |
|------|-----------|-----|-------|------------|
| PageLayout body | vertical | — | full | — |
| GameCard | — | — | full, flex-1 | — |
| Обводка поля | — | — | full (inset) | — |
| Козырь | — | — | shrink, по центру | — |
| slot1 | — | — | shrink, low end | — |
| slot2 | — | — | shrink, low start | — |
| slot3 | — | — | shrink, high start, rotate-180 | — |
| slot4 | — | — | shrink, high end, rotate-180 | — |
| PlayerCard | vertical | внутри компонента | своя, из стилей компонента | — |
| Прямоугольники в PlayerCard | — | — | внешний угол слота, поверх обводки поля | — |
| Строка счёта | horizontal | внутри компонента | shrink | — |
| Имя и команда | vertical | внутри компонента | full ширины карточки, высота фиксированная | — |
| Footer | — | — | full | — |

На `PlayerCard` при `align="end"` строка счёта и текст прижаты к концу карточки, текст справа. При `align="start"` — к началу, текст слева. Для слотов 3 и 4 этот align задаётся в координатах карточки до поворота обёртки.

## Компоненты

- `@/shared/ui/PageLayout` — тело и footer. Кнопку класть в `footer`
- `@/shared/ui/GameCard` — default export `GameCard`
  - `trump`: `"крести" | "пики" | "черви" | "буби"` (`GameCardTrump`)
  - `players`: список `{ id, name }` в порядке выбора, уже без пропавших id
  - `teamMode`: командный режим
  - `teamNames`: `{ black: string | null, red: string | null }` — имена, которые страница нашла по id
  - `scores`: `Record<string, number>`
  - `dealerId`: `string | null`
  - `className?`
  Цвет, подпись команды, счёт на карточке и угол ставит `GameCard`. `align` страница не задаёт.
- `@/shared/ui/PlayerCard` — default export `PlayerCard`
  - `name: string` — фиксированная высота, длинный текст с многоточием
  - `score: number` — как есть, без форматирования
  - `variant`: `"red" | "black"` (`PlayerCardVariant`) — цвет счёта
  - `align`: `"start" | "end"` (`PlayerCardAlign`) — задаёт `GameCard`
  - `dealer?: boolean` — при `true` знак `src/assets/icons/dealer.svg` (`dealer`) слева от счёта, `alt="Раздает"`. Файл не масштабировать: у карточки свой размер из SVG
  - `teamName?: string` — блок фиксированной высоты, только если prop передан: «Команда:», затем значение; лишнее с многоточием
  - `className?`
  - два прямоугольника не props: они внутри карточки и закрывают обводку `GameCard`. С `teamName` и без него высота разная
- `@/components/ui/button` — footer: `variant="outline"`, `size="default"`, `className="w-full shadow-xs"`. Подпись «Завершить раунд»
- Козырь, файлы мастей (не переписывать, не подменять lucide). Именованный экспорт из `src/assets/icons/index.ts`: `clubs`, `spades`, `hearts`, `diamonds`. Значение `trump` остаётся русским:
  - `trump="крести"` → `src/assets/icons/suit-clubs.svg` (`clubs`), `alt="крести"`
  - `trump="пики"` → `src/assets/icons/suit-spades.svg` (`spades`), `alt="пики"`
  - `trump="черви"` → `src/assets/icons/suit-hearts.svg` (`hearts`), `alt="черви"`
  - `trump="буби"` → `src/assets/icons/suit-diamonds.svg` (`diamonds`), `alt="буби"`
- `src/assets/icons/dealer.svg` (`dealer`) — тот же файл, что у подписи «Раздает:» на `/game-start`. На карточке игрока обёртку размером не задавать

## Сборка страницы

Страницу собирает Frontend Developer по этому файлу. `Game.tsx` этим макетом не создаётся.

```tsx
<PageLayout
  footer={
    <Button variant="outline" size="default" className="w-full shadow-xs">
      Завершить раунд
    </Button>
  }
>
  <GameCard
    trump="крести"
    players={[
      { id: "…", name: "…" },
      { id: "…", name: "…" },
      { id: "…", name: "…" },
      { id: "…", name: "…" },
    ]}
    teamMode
    teamNames={{ black: "…", red: "…" }}
    scores={{}}
    dealerId={null}
  />
</PageLayout>
```

Страница передаёт список `{ id, name }`, режим, имена команд, счёт и id раздающего. Цвет, подпись команды, счёт на карточке и угол ставит `GameCard`.

Диалог подтверждения в эту компоновку не входит: `@/components/ui/alert-dialog` подключает Frontend Developer.

## Не включать

- Цвета, px, шрифты, border-radius — это в стилях компонентов
- Бизнес-логику и валидацию — это в product spec
