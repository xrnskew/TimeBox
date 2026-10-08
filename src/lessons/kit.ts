import { functionLines, stripComments } from '../core/progress.ts'
import type { BuildPiece, BuildTask, EditTask, InsertPlan, Rich, RunTask } from './types.ts'

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

/** Строка `var name = "…"` — что между кавычками: рисунок (`var shipPic = "ракета"`) или цвет (`"#5ec639"`). */
export const quoted = (name: string, code: string): string | null => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(["'])(.*?)\\1`, 'm').exec(stripComments(code))
  return m ? m[2].trim() : null
}

/** Что выделить в строке `var name = "…"`: то, что между кавычками. */
export const quotedTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*["'](?<value>[^"']*)["']`, 'd')

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

// ===== Готовые квесты: одинаковые во всех играх, отличаются только именами и текстами =====

/** «Создай героя»: строка `var name = "рисунок";` в конец вкладки. */
export function createPicQuest(o: {
  title: string
  text: Rich
  tab: number
  /** Имя переменной и рисунок, с которого начинают. */
  name: string
  pic: string
  /** Подпись куска («Картинка героя») и комментарий над строкой («герой — любая картинка»). */
  piece: string
  comment: string
  doneText: string
}): BuildTask {
  const declared = new RegExp(`\\bvar\\s+${o.name}\\s*=`)
  return {
    kind: 'build',
    title: o.title,
    text: o.text,
    tab: o.tab,
    pieces: [
      {
        title: o.piece,
        plan: append(`// ${o.comment}\nvar ${o.name} = "${o.pic}";`),
        isDone: (code) => has(code, declared),
      },
    ],
    doneText: o.doneText,
  }
}

/** «Нарисуй героя»: пустая функция → `drawPic(рисунок, x, y)` — готовая функция движка. */
export function drawPicQuest(o: {
  title: string
  text: Rich
  tab: number
  fn: string
  /** Переменная с рисунком и координаты: `drawPic(pic, x, y)`. */
  pic: string
  x: string
  y: string
  doneText: string
}): BuildTask {
  const drawn = new RegExp(`\\bdrawPic\\s*\\(\\s*${o.pic}\\s*,\\s*${o.x}\\s*,\\s*${o.y}\\s*\\)`)
  return {
    kind: 'build',
    title: o.title,
    text: o.text,
    tab: o.tab,
    pieces: [
      shell(o.fn),
      {
        title: `Нарисовать картинку в точке ${o.x}, ${o.y}`,
        plan: into(o.fn, `  drawPic(${o.pic}, ${o.x}, ${o.y});`),
        isDone: (code) => has(code, drawn),
      },
    ],
    doneText: o.doneText,
  }
}

/** «Нажми «Собрать»»: засчитан, когда в последнем запуске были все куски квестов `after` (и выполнено `also`). */
export function runQuest(o: {
  title: string
  text: Rich
  callout: string
  doneText: string
  after: BuildTask[]
  also?: (ran: string[]) => boolean
}): RunTask {
  const tab = o.after[0].tab
  return {
    kind: 'run',
    title: o.title,
    text: o.text,
    tab,
    callout: o.callout,
    doneText: o.doneText,
    isDone: (ran) => o.after.every((t) => t.pieces.every((p) => p.isDone(ran[t.tab] ?? ''))) && (o.also?.(ran) ?? true),
  }
}

/** «Выбери героя»: кнопка открывает окно рисунков; засчитан любой рисунок, кроме исходного. */
export function pickPicQuest(o: {
  title: string
  text: Rich
  tab: number
  name: string
  /** Рисунок, с которого начинают: он не засчитывается. */
  pic: string
  hint: Rich
}): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: quotedTarget(o.name),
    picker: 'pic',
    hint: [o.hint],
    isDone(code) {
      const pic = quoted(o.name, code)
      return !!pic && pic !== o.pic
    },
  }
}

/** «Выбери цвет»: кнопка открывает палитру; засчитан любой цвет, кроме исходного. */
export function pickColorQuest(o: {
  title: string
  text: Rich
  tab: number
  name: string
  color: string
  hint: Rich
}): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: quotedTarget(o.name),
    picker: 'color',
    hint: [o.hint],
    isDone(code) {
      const color = quoted(o.name, code)
      return !!color && color.toLowerCase() !== o.color.toLowerCase()
    },
  }
}

/** «Дай герою скорость»: в «Движке» стоит 0, засчитано любое число больше 0. Кнопка выделяет число. */
export function numberQuest(o: { title: string; text: Rich; tab: number; name: string; hint: Rich }): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: numberTarget(o.name),
    hint: [o.hint],
    isDone: numberAbove0(o.name),
  }
}
