import { stripComments } from '../../core/progress.ts'
import type { BuildTask, EditTask, InsertPlan } from '../types.ts'

// Задания после шагов. Чистые функции: проверяют код и говорят, куда вставить кусок.
// Совпадения ищутся в коде без комментариев, а номера строк — те же, что в исходном.

const linesOf = (code: string) => stripComments(code).split('\n')

/** Номер строки (с 1), где впервые совпало; 0 — нигде. */
function lineOf(code: string, re: RegExp): number {
  return linesOf(code).findIndex((l) => re.test(l)) + 1
}

const has = (code: string, re: RegExp) => re.test(stripComments(code))

// ===== Шаг 1 → своя корзина =====

const PLAYER_EMOJI = /^\s*var\s+playerEmoji\s*=\s*(["'])(.*?)\1/m

export const BASKET_TASK: EditTask = {
  kind: 'edit',
  title: 'Своя корзина',
  text: 'Зайди в «Движок» и поменяй 🧺 на любой другой смайлик — например, 🐱 или 🛸.',
  tab: 0,
  target: /var\s+playerEmoji\s*=\s*["'](?<emoji>[^"']*)["']/d,
  hint: ['Это строка `var playerEmoji = "🧺";` в самом начале. Поменяй смайлик между кавычками и нажми «Запустить».'],
  isDone(engine) {
    const m = PLAYER_EMOJI.exec(stripComments(engine))
    if (!m) return false
    const emoji = m[2].trim()
    return emoji !== '' && emoji !== '🧺'
  },
}

// ===== Шаг 2 → «Всё быстрее»: функцию собирают кнопками =====

const SPEEDUP_DECL = /\bfunction\s+speedUp\s*\(\s*\)\s*\{/
const SPEEDUP_IF = /\bif\s*\(\s*frame\s*%\s*900\s*===\s*0\s*&&\s*fallSpeed\s*<\s*8\s*\)\s*\{/
const SPEEDUP_STEP = /\bfallSpeed\s*=\s*fallSpeed\s*\+\s*1\s*;/
const SPEEDUP_CALL = /(^|[^\w.$])speedUp\s*\(\s*\)\s*;/m
const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/

function after(code: string, re: RegExp, text: string): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line, text } : null
}

export const SPEEDUP_TASK: BuildTask = {
  kind: 'build',
  title: 'Всё быстрее',
  text: 'Каждые 15 секунд яблоки падают быстрее, но не быстрее 8. Собери функцию по частям — жми кнопки по порядку.',
  tab: 2,
  pieces: [
    {
      title: 'Пустая функция speedUp',
      code: '// каждые 15 секунд игра становится быстрее\nfunction speedUp() {\n}',
      plan: (code) => ({
        after: code.split('\n').length,
        text: '\n// каждые 15 секунд игра становится быстрее\nfunction speedUp() {\n}',
      }),
      isDone: (code) => has(code, SPEEDUP_DECL),
    },
    {
      title: 'Раз в 15 секунд, пока скорость меньше 8',
      code: '  if (frame % 900 === 0 && fallSpeed < 8) {\n  }',
      plan: (code) => after(code, SPEEDUP_DECL, '  if (frame % 900 === 0 && fallSpeed < 8) {\n  }'),
      isDone: (code) => has(code, SPEEDUP_IF),
    },
    {
      title: 'Прибавить скорость',
      code: '    fallSpeed = fallSpeed + 1;',
      plan: (code) => after(code, SPEEDUP_IF, '    fallSpeed = fallSpeed + 1;'),
      isDone: (code) => has(code, SPEEDUP_IF) && has(code, SPEEDUP_STEP),
    },
    {
      title: 'Вызывать каждый кадр в moveItems',
      code: '  speedUp();',
      plan: (code) => (has(code, SPEEDUP_DECL) ? after(code, FRAME_TICK, '  speedUp();') : null),
      isDone: (code) => has(code, SPEEDUP_CALL),
    },
  ],
}

// ===== Шаг 3 → десять очков =====

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
