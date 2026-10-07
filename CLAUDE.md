# TimeBox

TimeBox — конструктор игр (веб-приложение). Название сайта и заголовок вкладки — «TimeBox — конструктор
игр». Сейчас в нём две игры-урока — Catch (бывшая «Лови яблоки») и Птичка (`bird`, как Flappy Bird):
ученик по шагам пишет игру на JavaScript, вкладки склеиваются в один скрипт и запускаются
в iframe.

- ТЗ и механизмы, которые нельзя ломать: `docs/SPEC.md`
- План и предложения: `docs/PLAN.md`

## Стек

- React 19, TypeScript (strict-ish: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`)
- Vite 8, `@vitejs/plugin-react`; `npm run build` — сайт в `dist/` (base из `BASE_PATH`, по умолчанию `/`),
  `npm run build:single` — один файл `dist-single/hitbox.html` через `vite-plugin-singlefile`
- CodeMirror 6, acorn
- Стили — обычный CSS: токены в `src/styles/tokens.css`, компоненты на CSS-модулях. Tailwind нет.
- Линтер: oxlint (`.oxlintrc.json`); формат — prettier `--print-width 120 --single-quote --no-semi`
- Алиас `@/` → `src/` (настроен в `vite.config.ts` и `tsconfig.app.json`)

## Устройство

- `src/core/` — чистые модули без DOM и React (склейка, синтаксис, переводы ошибок, прогресс,
  уровни — что открыто, хеш пароля готовой игры).
  Импорты внутри — относительные с `.ts`, чтобы их можно было запускать прямо в Node:
  `node -e "import('./src/core/syntax.ts').then(m => console.log(m.findSyntaxError('if (')))"`.
- `src/lessons/<id>/` — пакет урока (`catch`, `bird`): код вкладок, тексты гайда, квесты, подсказки, кнопки
  на корпусе приставки (`controls`), цвет корпуса (`consoleColor`: Catch — зелёный, Птичка — жёлтый).
  Ядро про яблоки и птиц не знает. Общие помощники квестов — `src/lessons/kit.ts`.
  Все игры перечислены в `src/lessons/index.ts` — из него строится главное меню.
- Конец игры: `lives <= 0` (Catch) или `gameOver === true` (Птичка). «Границы» рисует обвязка — своя функция
  на каждую игру (`HITBOXES` в `runtime.js`, id игры приходит в строке `__TB_CFG`).
- Адреса (`src/app/routes.ts`): без параметров — главное меню, `?game=<id>` — игра, `&finished` — готовая версия.
- `src/sandbox/runtime.js` — первый скрипт в iframe (обвязка). В нём нельзя писать закрывающий тег скрипта.
- `src/app/controller.ts` — вся логика приложения; React-компоненты тонкие и читают внешний стор.
- `src/editor/` — CodeMirror: один EditorView, по EditorState на вкладку.

## Проверки перед коммитом

```bash
npm run lint
npm run build      # tsc -b + vite build
npm test           # vitest: ядро и логика игры без браузера
npm run test:e2e   # playwright: hitbox.html через file:// и сайт в /TimeBox/ (Chromium уже установлен в облачном окружении)
```

## Деплой

Основная ветка репозитория — `claude/magical-carson-tegs5x` (ветки `main` нет). Готовые изменения
после всех проверок вливать в неё сразу, без отдельного вопроса (просьба пользователя): fast-forward
`git push origin HEAD:claude/magical-carson-tegs5x`, если основная ветка не ушла вперёд.

Vercel-проект `timebox` подключается к репозиторию GitHub и собирает основную ветку при
каждом пуше; настройки сборки — в `vercel.json`. Запасной адрес — GitHub Pages
(`.github/workflows/pages.yml`, base `/<репозиторий>/` через `BASE_PATH`); туда же кладётся
`hitbox.html`. Вручную ничего не выкладывать без явной просьбы пользователя.

## Дизайн

Для любой работы над интерфейсом (экраны, компоненты, стили) использовать скилл
`frontend-design` от Anthropic. Плагин включён на уровне проекта в `.claude/settings.json`
(`frontend-design@claude-plugins-official`).
