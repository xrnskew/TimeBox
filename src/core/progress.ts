// Прогресс ученика: есть ли во вкладке код, сделан ли шаг, есть ли уже часть задания.
// Всё считается по тексту без комментариев, так что работает даже при синтаксической ошибке.

/**
 * Заменяет комментарии пробелами. Длина и переводы строк сохраняются,
 * поэтому позиции в результате совпадают с исходным кодом.
 */
export function stripComments(code: string): string {
  const out: string[] = []
  const n = code.length
  let i = 0
  while (i < n) {
    const c = code[i]
    const d = code[i + 1]
    if (c === '/' && d === '/') {
      while (i < n && code[i] !== '\n') {
        out.push(' ')
        i++
      }
      continue
    }
    if (c === '/' && d === '*') {
      const end = code.indexOf('*/', i + 2)
      const stop = end < 0 ? n : end + 2
      for (; i < stop; i++) out.push(code[i] === '\n' ? '\n' : ' ')
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      out.push(c)
      i++
      while (i < n && code[i] !== c) {
        if (code[i] === '\\' && i + 1 < n) {
          out.push(code[i], code[i + 1])
          i += 2
          continue
        }
        if (code[i] === '\n' && c !== '`') break
        out.push(code[i])
        i++
      }
      if (i < n && code[i] === c) {
        out.push(c)
        i++
      }
      continue
    }
    out.push(c)
    i++
  }
  return out.join('')
}

/** Во вкладке есть что-то, кроме комментариев и пустых строк. */
export function hasContent(code: string): boolean {
  return stripComments(code).trim().length > 0
}

/** Индекс парной закрывающей скобки или -1. Строки внутри пропускаются. */
function matchBracket(src: string, open: number): number {
  const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' }
  const stack: string[] = []
  for (let i = open; i < src.length; i++) {
    const c = src[i]
    if (c === '"' || c === "'" || c === '`') {
      i++
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') i++
        else if (src[i] === '\n' && c !== '`') break
        i++
      }
      continue
    }
    if (pairs[c]) stack.push(pairs[c])
    else if (c === ')' || c === '}' || c === ']') {
      if (stack.pop() !== c) return -1
      if (stack.length === 0) return i
    }
  }
  return -1
}

export type FnState = 'ok' | 'empty' | 'missing'

/** Объявлена ли функция `name` и есть ли что-нибудь внутри. Берётся последнее объявление. */
export function functionState(code: string, name: string): FnState {
  const src = stripComments(code)
  const re = new RegExp(`\\bfunction\\s+${name}\\s*\\(`, 'g')
  let last = -1
  for (let m = re.exec(src); m; m = re.exec(src)) last = m.index + m[0].length - 1
  if (last < 0) return 'missing'
  const closeParen = matchBracket(src, last)
  if (closeParen < 0) return 'empty'
  const open = src.indexOf('{', closeParen)
  if (open < 0 || src.slice(closeParen + 1, open).trim() !== '') return 'empty'
  const close = matchBracket(src, open)
  const body = close < 0 ? src.slice(open + 1) : src.slice(open + 1, close)
  return body.trim() ? 'ok' : 'empty'
}

export function stepStates(code: string, fns: string[]): { name: string; state: FnState }[] {
  return fns.map((name) => ({ name, state: functionState(code, name) }))
}

/** Шаг сделан: все его функции объявлены и не пустые. */
export function stepDone(code: string, fns: string[]): boolean {
  return fns.every((name) => functionState(code, name) === 'ok')
}

/** Часть задания «уже есть в коде»: все признаки находятся в коде без комментариев. */
export function partDone(code: string, marks: RegExp[]): boolean {
  const src = stripComments(code)
  return marks.every((re) => re.test(src))
}

/** Объявлена ли переменная `var name` (не в комментарии). Возвращает номер строки или 0. */
export function varLine(code: string, name: string): number {
  const lines = stripComments(code).split('\n')
  const re = new RegExp(`^\\s*var\\s+${name}\\b`)
  const i = lines.findIndex((l) => re.test(l))
  return i + 1
}
