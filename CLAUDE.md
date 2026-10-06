# TimeBox

Конструктор видеоигр (веб-приложение). Подробное ТЗ ещё не добавлено — уточнять у пользователя.

## Стек

- React 19, TypeScript (strict-ish: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`)
- Vite 8, `@vitejs/plugin-react`
- Линтер: oxlint (`.oxlintrc.json`)
- Алиас `@/` → `src/` (настроен в `vite.config.ts` и `tsconfig.app.json`)

## Проверки перед коммитом

```bash
npm run lint
npm run build   # tsc -b + vite build
```

## Дизайн

Макеты и дизайн-система ведутся в Claude Design (claude.ai/design). Для синхронизации
компонентов используется `/design-sync`; для этого нужна авторизация `/design-login`
в интерактивной сессии Claude Code. В облачной сессии (claude.ai/code) проект можно
передать через «Send to Claude Code Web» в Claude Design.
