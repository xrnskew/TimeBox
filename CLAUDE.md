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

Для любой работы над интерфейсом (экраны, компоненты, стили) использовать скилл
`frontend-design` от Anthropic. Плагин включён на уровне проекта в `.claude/settings.json`
(`frontend-design@claude-plugins-official`).
