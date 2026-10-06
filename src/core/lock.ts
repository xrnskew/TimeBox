// Пароль на готовую игру. Это защита от случайного открытия на уроке, а не настоящая
// безопасность: сайт целиком лежит у ученика в браузере. Поэтому храним не сам пароль,
// а его хеш — его не прочитать, просто открыв код страницы.

/** cyrb53 — короткий быстрый хеш строки. */
export function hash(text: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const FINISHED_HASH = 'g7bv4vtwad'

export function checkFinishedPassword(input: string): boolean {
  return hash(input.trim(), 7) === FINISHED_HASH
}
