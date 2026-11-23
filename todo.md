# Todo

Только **приоритет 1**, которого **нет** в `src/docs/spec.md`. Продуктовые экраны и их P1 — там, с галочками.

- [x] Применить новые варианты `Button` (`iconSize` и пр.) на существующих экранах (Home, Participants, формы)
- [x] Расширить сессию `currentGame` полями партии: козырь, раздающий, счёт (и контекст вокруг них)
- [ ] Маршруты `/game`, `/round-end`, `/game-end`
- [ ] Исправить `npm run build` (TS5101: deprecated `baseUrl` в tsconfig)
- [ ] Вынести роуты тестов в `src/test/router.tsx` и сделать общую функцию `renderWithRouter` на базе `createMemoryRouter` (убрать дублирование в тестовых файлах, включая `Participants.test.tsx` и `Game.test.tsx`)
- [ ] Минимум 2 игрока для старта партии: константа `MIN_PLAYER_COUNT = 2` в `gameRules.ts`, проверка в `currentGameStorage.ts` (`gameStarted: true`), `Participants.tsx` (включая обычный режим) и редирект в `GameStart.tsx` при `< 2` игроков
- [ ] `ParticipantsContext.tsx`: запретить повторный вызов `startGame` при `gameStarted: true` (при необходимости вынести следующий раунд в отдельный метод вроде `startNextRound`), а в `setPlayerSelected` / `setTeamMode` делать ранний `return` при `gameStarted: true` и сбрасывать только `currentTeamIds` при `gameStarted: false`; убрать лишний пробел в `Home.tsx`
- [ ] Предупреждение на `Home.tsx` при нажатии «Начать новую игру», если есть незавершённая партия (`gameStarted: true`)
- [ ] Почистить тесты: вынести `TEST_PLAYERS` / `TEST_TEAMS` в `src/test/storage.ts`, заменить `try/catch` в `expectParticipantsError` на `toThrow(new CurrentGameValidationError(...))`, обновить сиды с 1 игрока на `>= 2`, убрать дублирующиеся проверки логики (не трогая `rotate-180` и детальные проверки классов)
- [ ] Привести компоненты к нативному виду в дизайне, затем в самом приложении
