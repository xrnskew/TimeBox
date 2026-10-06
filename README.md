# TimeBox

Конструктор видеоигр. Фронтенд на React 19 + TypeScript, сборка — Vite.

## Запуск

```bash
npm install
npm run dev        # дев-сервер с HMR, http://localhost:5173
```

## Скрипты

| Команда             | Что делает                                 |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | дев-сервер Vite                            |
| `npm run build`     | проверка типов + продакшн-сборка в `dist/` |
| `npm run typecheck` | только проверка типов (`tsc -b`)           |
| `npm run lint`      | линтер (oxlint)                            |
| `npm run preview`   | локальный просмотр собранного `dist/`      |

## Структура

```
index.html          точка входа HTML
src/main.tsx        монтирование React
src/App.tsx         корневой компонент
src/index.css       глобальные стили и CSS-переменные темы
public/             статика, отдаётся как есть
```

Импорты из `src` можно писать через алиас `@/`, например `import App from '@/App'`.
