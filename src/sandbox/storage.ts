// Сохранение в localStorage. Всё в try/catch: нет хранилища (приватный режим,
// запрет сайта) — приложение работает без сохранения. Битые данные или не та длина
// массива — стартуем с исходного кода.

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // нет места или нет доступа — работаем без сохранения
  }
}

export function loadCodes(key: string, count: number): string[] | null {
  const raw = read(key)
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (Array.isArray(data) && data.length === count && data.every((x) => typeof x === 'string')) return data
  } catch {
    // битые данные
  }
  return null
}

export function saveCodes(key: string, codes: string[]) {
  write(key, JSON.stringify(codes))
}

export type SavedView = 'guide' | number

export function loadActive(key: string, count: number): SavedView | null {
  const raw = read(`${key}:active`)
  if (raw === 'guide') return 'guide'
  const n = Number(raw)
  return raw !== null && Number.isInteger(n) && n >= 0 && n < count ? n : null
}

export function saveActive(key: string, view: SavedView) {
  write(`${key}:active`, String(view))
}

export function loadBest(key: string): number {
  const n = Number(read(`${key}:best`))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function saveBest(key: string, best: number) {
  write(`${key}:best`, String(best))
}

export interface Prefs {
  projector: boolean
  codeSize: number
}

const PREFS_KEY = 'timebox:prefs'
export const DEFAULT_PREFS: Prefs = { projector: false, codeSize: 14 }

export function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(read(PREFS_KEY) ?? '{}') as Partial<Prefs>
    return {
      projector: p.projector === true,
      codeSize:
        typeof p.codeSize === 'number' && p.codeSize >= 11 && p.codeSize <= 24 ? p.codeSize : DEFAULT_PREFS.codeSize,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(p: Prefs) {
  write(PREFS_KEY, JSON.stringify(p))
}
