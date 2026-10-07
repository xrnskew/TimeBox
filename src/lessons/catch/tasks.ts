import { functionLines, stripComments } from '../../core/progress.ts'
import type { BuildPiece, BuildTask, EditTask, InsertPlan, RunTask } from '../types.ts'
import { HERO_EMOJI } from './tabs.ts'

// Квесты шагов. Чистые функции: проверяют код и говорят, куда вставить кусок.
// Совпадения ищутся в коде без комментариев, а номера строк — те же, что в исходном.
// Код шага собирается кнопками «Добавить» по кусочкам и в итоге совпадает с STEP_* из tabs.ts.

const linesOf = (code: string) => stripComments(code).split('\n')

/** Номер строки (с 1), где впервые совпало; 0 — нигде. */
function lineOf(code: string, re: RegExp): number {
  return linesOf(code).findIndex((l) => re.test(l)) + 1
}

const has = (code: string, re: RegExp) => re.test(stripComments(code))

/** Кусок — под строкой, где совпало `re`; null — такой строки ещё нет. */
function after(code: string, re: RegExp, text: string): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line, text } : null
}

/** Новая функция или переменная — в конец вкладки, через пустую строку. */
const append =
  (text: string) =>
  (code: string): InsertPlan => ({ after: code.split('\n').length, text: `\n${text}` })

/** Кусок — в конец тела функции `name`, перед её закрывающей }. */
const into =
  (name: string, text: string) =>
  (code: string): InsertPlan | null => {
    const f = functionLines(code, name)
    // функция на одной строке, `function f() {}`: места внутри нет
    return f && f.close > f.open ? { after: f.close - 1, text } : null
  }

const decl = (name: string) => new RegExp(`\\bfunction\\s+${name}\\s*\\(\\s*\\)\\s*\\{`)

/** Пустая функция — первая часть любой сборки. */
const shell = (name: string): BuildPiece => ({
  title: `Пустая функция ${name}`,
  plan: append(`function ${name}() {\n}`),
  isDone: (code) => has(code, decl(name)),
})

/** Строка `var name = "смайлик"` — смайлик между кавычками. */
const emojiOf = (name: string, code: string): string | null => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(["'])(.*?)\\1`, 'm').exec(stripComments(code))
  return m ? m[2].trim() : null
}

/** Что выделить в строке `var name = "…"`: сам смайлик. */
const emojiTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*["'](?<emoji>[^"']*)["']`, 'd')

// ===== Шаг 1. Герой: создать смайлик → выбрать → нарисовать → собрать → движение → скорость =====

const HERO_VAR = /\bvar\s+playerEmoji\s*=/

export const HERO_CREATE_TASK: BuildTask = {
  kind: 'build',
  title: 'Создай героя',
  text: 'Герой — это смайлик. Открой «Герой»: там всплывёт строчка с ним — жми «Добавить».',
  tab: 1,
  pieces: [
    {
      title: 'Смайлик героя',
      plan: append(`// герой — любой смайлик\nvar playerEmoji = "${HERO_EMOJI}";`),
      isDone: (code) => has(code, HERO_VAR),
    },
  ],
  doneText: 'Герой создан! Теперь нажми «Сменить» рядом со смайликом и выбери, кем он будет.',
}

export const HERO_PICK_TASK: EditTask = {
  kind: 'edit',
  title: 'Выбери героя',
  text: `Нажми «Сменить» рядом со смайликом ${HERO_EMOJI} и выбери своего героя — например, 🐱 или 🛸.`,
  tab: 1,
  target: emojiTarget('playerEmoji'),
  picker: true,
  hint: [
    `Это строка \`var playerEmoji = "${HERO_EMOJI}";\` во вкладке «Герой». Кнопка «Сменить» — прямо рядом с ней. Можно и напечатать смайлик между кавычками самому.`,
  ],
  isDone(hero) {
    const emoji = emojiOf('playerEmoji', hero)
    return !!emoji && emoji !== HERO_EMOJI
  },
}

const HERO_FONT = /\bctx\.font\s*=/
const HERO_TEXT = /\bctx\.fillText\s*\(\s*playerEmoji\s*,\s*playerX\s*,\s*playerY\s*\)/

export const HERO_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй героя',
  text: 'Движок 60 раз в секунду зовёт `drawPlayer()`. Собери её по кусочкам — кнопки «Добавить» всплывут в «Герое».',
  tab: 1,
  pieces: [
    shell('drawPlayer'),
    {
      title: 'Размер смайлика',
      plan: into('drawPlayer', '  ctx.font = "34px serif";'),
      isDone: (code) => has(code, HERO_FONT),
    },
    {
      title: 'Нарисовать смайлик в точке playerX, playerY',
      plan: into('drawPlayer', '  ctx.fillText(playerEmoji, playerX, playerY);'),
      isDone: (code) => has(code, HERO_TEXT),
    },
  ],
  doneText: 'Все кусочки героя на месте!',
}

export const HERO_RUN_TASK: RunTask = {
  kind: 'run',
  title: 'Собери игру',
  text: 'Нажми «Собрать» или [[Ctrl]] + [[Enter]] — герой появится внизу экрана.',
  tab: 1,
  callout: 'Герой нарисован! Нажми «Собрать» — и он появится на экране.',
  doneText: 'Вот твой герой!',
  isDone: (ran) => HERO_DRAW_TASK.pieces.every((p) => p.isDone(ran[1] ?? '')),
}

export const HERO_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Научи героя ездить',
  text: 'Движок зовёт и `movePlayer()`: она слушает стрелки и двигает героя. Собери её по кусочкам в «Герое».',
  tab: 1,
  pieces: [
    shell('movePlayer'),
    {
      title: 'Стрелка ← — едем влево',
      plan: into('movePlayer', '  if (keys["ArrowLeft"])  playerX = playerX - playerSpeed;'),
      isDone: (code) => has(code, /["']ArrowLeft["']/),
    },
    {
      title: 'Стрелка → — едем вправо',
      plan: into('movePlayer', '  if (keys["ArrowRight"]) playerX = playerX + playerSpeed;'),
      isDone: (code) => has(code, /["']ArrowRight["']/),
    },
    {
      title: 'Не уезжать за край',
      plan: into(
        'movePlayer',
        '\n  // не даём герою уехать за край поля\n  if (playerX < 0)   playerX = 0;\n  if (playerX > 340) playerX = 340;',
      ),
      isDone: (code) =>
        has(code, /\bif\s*\(\s*playerX\s*<\s*0\s*\)/) && has(code, /\bif\s*\(\s*playerX\s*>\s*340\s*\)/),
    },
  ],
  doneText: 'Движение готово! Но герой пока стоит: в «Движке» скорость playerSpeed — 0. Следующий квест — в «Гайде».',
}

const PLAYER_SPEED = /^\s*var\s+playerSpeed\s*=\s*([\d.]+)\s*(;|$)/m

export const SPEED_TASK: EditTask = {
  kind: 'edit',
  title: 'Дай герою скорость',
  text: 'Герой стоит, потому что в «Движке» `playerSpeed` — 0. Поставь число от 2 до 4, нажми «Собрать» и проверь стрелками.',
  tab: 0,
  target: /var\s+playerSpeed\s*=\s*(?<speed>[^;\s]*)/d,
  hint: [
    'Это первая строка «Движка»: `var playerSpeed = 0;`. Это сколько пикселей герой проезжает за кадр: 2 — спокойно, 4 — шустро. Попробуй разные!',
  ],
  isDone(engine) {
    const m = PLAYER_SPEED.exec(stripComments(engine))
    return !!m && Number(m[1]) > 0
  },
}

// ===== Шаг 2. Яблоки: падают → рисуются → «Всё быстрее» → «Не только яблоки» =====

const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/

export const ITEMS_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Яблоки падают',
  text: 'Собери `moveItems()` в «Яблоках»: раз в секунду сверху появляется яблоко, и все яблоки летят вниз.',
  tab: 2,
  pieces: [
    shell('moveItems'),
    {
      title: 'Считать кадры',
      plan: into('moveItems', '  frame = frame + 1;'),
      isDone: (code) => has(code, FRAME_TICK),
    },
    {
      title: 'Раз в секунду — новое яблоко',
      plan: into(
        'moveItems',
        '\n  // раз в spawnEvery кадров — новое яблоко в случайном месте сверху\n  if (frame % spawnEvery === 0) {\n    items.push({ x: Math.random() * 340, y: 0 });\n  }',
      ),
      isDone: (code) => has(code, /\bitems\.push\s*\(/),
    },
    {
      title: 'Все яблоки опускаются вниз',
      plan: into(
        'moveItems',
        '\n  // все яблоки опускаются вниз\n  for (var i = 0; i < items.length; i++) {\n    items[i].y = items[i].y + fallSpeed;\n  }',
      ),
      isDone: (code) => has(code, /(\+|\+=)\s*fallSpeed\b/),
    },
  ],
  doneText: 'Яблоки падают! Нажми «Собрать»: в «Приборах» растёт items. Но яблок пока не видно — дальше нарисуем.',
}

export const ITEMS_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй яблоки',
  text: 'Собери `drawItems()`: она рисует каждое яблоко из массива `items`.',
  tab: 2,
  pieces: [
    shell('drawItems'),
    {
      title: 'Размер смайлика',
      plan: into('drawItems', '  ctx.font = "34px serif";'),
      isDone: (code) => has(code, /\bctx\.font\s*=/),
    },
    {
      title: 'Нарисовать каждое яблоко',
      plan: into(
        'drawItems',
        '\n  for (var i = 0; i < items.length; i++) {\n    ctx.fillText(itemEmoji, items[i].x, items[i].y);\n  }',
      ),
      isDone: (code) => has(code, /\bctx\.fillText\s*\(/),
    },
  ],
  doneText: 'Яблоки нарисованы! Нажми «Собрать» — они посыплются сверху.',
}

const SPEEDUP_DECL = decl('speedUp')
const SPEEDUP_IF = /\bif\s*\(\s*frame\s*%\s*900\s*===\s*0\s*&&\s*fallSpeed\s*<\s*8\s*\)\s*\{/
const SPEEDUP_STEP = /\bfallSpeed\s*=\s*fallSpeed\s*\+\s*1\s*;/
const SPEEDUP_CALL = /(^|[^\w.$])speedUp\s*\(\s*\)\s*;/m

export const SPEEDUP_TASK: BuildTask = {
  kind: 'build',
  title: 'Всё быстрее',
  text: 'Каждые 15 секунд яблоки падают быстрее, но не быстрее 8. Открой «Яблоки»: части функции всплывут прямо в коде — жми «Добавить» по порядку.',
  tab: 2,
  pieces: [
    {
      title: 'Пустая функция speedUp',
      plan: append('// каждые 15 секунд игра становится быстрее\nfunction speedUp() {\n}'),
      isDone: (code) => has(code, SPEEDUP_DECL),
    },
    {
      title: 'Раз в 15 секунд, пока скорость меньше 8',
      plan: (code) => after(code, SPEEDUP_DECL, '  if (frame % 900 === 0 && fallSpeed < 8) {\n  }'),
      isDone: (code) => has(code, SPEEDUP_IF),
    },
    {
      title: 'Прибавить скорость',
      plan: (code) => after(code, SPEEDUP_IF, '    fallSpeed = fallSpeed + 1;'),
      isDone: (code) => has(code, SPEEDUP_IF) && has(code, SPEEDUP_STEP),
    },
    {
      title: 'Вызывать каждый кадр в moveItems',
      plan: (code) => (has(code, SPEEDUP_DECL) ? after(code, FRAME_TICK, '  speedUp();') : null),
      isDone: (code) => has(code, SPEEDUP_CALL),
    },
  ],
  doneText: 'Функция собрана! Через 15 секунд после запуска яблоки полетят быстрее.',
}

export const ITEM_TASK: EditTask = {
  kind: 'edit',
  title: 'Не только яблоки',
  text: 'Зайди в «Движок» и нажми «Сменить» рядом с 🍎 — пусть падает что-нибудь другое, например 🍩 или 🐟.',
  tab: 0,
  target: emojiTarget('itemEmoji'),
  picker: true,
  hint: ['Это строка `var itemEmoji   = "🍎";` в самом начале «Движка». Кнопка «Сменить» — прямо рядом с ней.'],
  isDone(engine) {
    const emoji = emojiOf('itemEmoji', engine)
    return !!emoji && emoji !== '🍎'
  },
}

// ===== Шаг 3. Поимка: собрать checkCatch → десять очков =====

const CATCH_LOOP = /\bfor\s*\(\s*var\s+i\s*=\s*items\.length\s*-\s*1\b/
const BLIZKO = /\bvar\s+blizko\s*=/

export const CATCH_TASK: BuildTask = {
  kind: 'build',
  title: 'Поймал или уронил',
  text: 'Собери `checkCatch()` в «Поимке»: для каждого яблока проверяем, поймал его герой или уронил.',
  tab: 3,
  pieces: [
    shell('checkCatch'),
    {
      title: 'Перебрать все яблоки с конца',
      plan: into('checkCatch', '  for (var i = items.length - 1; i >= 0; i--) {\n  }'),
      isDone: (code) => has(code, CATCH_LOOP),
    },
    {
      title: 'Яблоко рядом с героем?',
      plan: (code) => after(code, CATCH_LOOP, '    var blizko = Math.abs(items[i].x - playerX) < 34;'),
      isDone: (code) => has(code, BLIZKO),
    },
    {
      title: 'Поймал — очко, уронил — минус жизнь',
      plan: (code) =>
        after(
          code,
          BLIZKO,
          '\n    if (blizko && items[i].y > playerY - 34) {\n      // поймал — плюс очко\n      score = score + 1;\n      items.splice(i, 1);\n\n    } else if (items[i].y > 500) {\n      // уронил — минус жизнь\n      lives = lives - 1;\n      items.splice(i, 1);\n    }',
        ),
      isDone: (code) => has(code, /\bif\s*\(\s*blizko\b/) && has(code, /\.y\s*>\s*500\b/),
    },
  ],
  doneText: 'Поимка готова! Нажми «Собрать» и лови яблоки.',
}

export const TEN_POINTS_TASK: EditTask = {
  kind: 'edit',
  title: 'Десять очков',
  text: 'Пусть каждое пойманное яблоко даёт 10 очков, а не одно.',
  tab: 3,
  target: /score\s*=\s*score\s*\+\s*(?<points>\d+)/d,
  hint: ['Найди строку `score = score + 1;` и поменяй 1 на 10.'],
  isDone: (code) => has(code, /\bscore\s*(=\s*score\s*\+|\+=)\s*10\b/),
}

/** Что выделить для задания «поправь сам»: строка (с 1) и столбцы [from, to). */
export function editTarget(code: string, target: RegExp): { line: number; from: number; to: number } | null {
  const lines = code.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = new RegExp(target.source, target.flags.includes('d') ? target.flags : `${target.flags}d`).exec(lines[i])
    const span = m?.indices?.[1]
    if (span) return { line: i + 1, from: span[0], to: span[1] }
  }
  return null
}
