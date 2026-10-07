import { functionLines, stripComments } from '../core/progress.ts'
import type { BuildPiece, InsertPlan } from './types.ts'

// Общие помощники для квестов любой игры. Чистые функции: проверяют код и говорят, куда вставить кусок.
// Совпадения ищутся в коде без комментариев, а номера строк — те же, что в исходном.

const linesOf = (code: string) => stripComments(code).split('\n')

/** Номер строки (с 1), где впервые совпало; 0 — нигде. */
export function lineOf(code: string, re: RegExp): number {
  return linesOf(code).findIndex((l) => re.test(l)) + 1
}

export const has = (code: string, re: RegExp) => re.test(stripComments(code))

/** Кусок — под строкой, где совпало `re`; null — такой строки ещё нет. */
export function after(code: string, re: RegExp, text: string): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line, text } : null
}

/** Новая функция или переменная — в конец вкладки, через пустую строку. */
export const append =
  (text: string) =>
  (code: string): InsertPlan => ({ after: code.split('\n').length, text: `\n${text}` })

/** Кусок — в конец тела функции `name`, перед её закрывающей }. */
export const into =
  (name: string, text: string) =>
  (code: string): InsertPlan | null => {
    const f = functionLines(code, name)
    // функция на одной строке, `function f() {}`: места внутри нет
    return f && f.close > f.open ? { after: f.close - 1, text } : null
  }

/** Объявление функции без параметров: `function name() {`. */
export const decl = (name: string) => new RegExp(`\\bfunction\\s+${name}\\s*\\(\\s*\\)\\s*\\{`)

/** Пустая функция — первая часть любой сборки. */
export const shell = (name: string): BuildPiece => ({
  title: `Пустая функция ${name}`,
  plan: append(`function ${name}() {\n}`),
  isDone: (code) => has(code, decl(name)),
})

/** Строка `var name = "смайлик"` — смайлик между кавычками. */
export const emojiOf = (name: string, code: string): string | null => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(["'])(.*?)\\1`, 'm').exec(stripComments(code))
  return m ? m[2].trim() : null
}

/** Что выделить в строке `var name = "…"`: сам смайлик. */
export const emojiTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*["'](?<emoji>[^"']*)["']`, 'd')

/** То же для любой строки в кавычках — например, цвета `var pipeColor = "#5ec639"`. */
export const stringOf = emojiOf
export const stringTarget = emojiTarget

/** Число в строке `var name = …;`: засчитано, когда оно больше 0. */
export const numberAbove0 = (name: string) => (code: string) => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*([\\d.]+)\\s*(;|$)`, 'm').exec(stripComments(code))
  return !!m && Number(m[1]) > 0
}

/** Что выделить в строке `var name = …;`: само число. */
export const numberTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*(?<n>[^;\\s]*)`, 'd')

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
