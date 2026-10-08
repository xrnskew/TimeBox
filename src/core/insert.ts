import { stripComments, varLine } from './progress.ts'

// Вставка одной строки настройки в «Движок». Вкладку никогда не заменяем целиком,
// иначе пропадут настройки ученика.

export type SettingPlan =
  | { kind: 'exists'; line: number }
  /** Вставить `text` после строки `after` (0 — в самое начало). */
  | { kind: 'insert'; after: number; text: string }

export function planSettingInsert(engine: string, name: string, text: string): SettingPlan {
  const existing = varLine(engine, name)
  if (existing) return { kind: 'exists', line: existing }

  const lines = stripComments(engine).split('\n')
  let after = -1
  lines.forEach((l, i) => {
    if (/^\s*var\s+\w*Pic\b/.test(l)) after = i + 1
  })
  if (after < 0) {
    const raw = engine.split('\n')
    const header = raw.findIndex((l) => l.includes('// ===== НАСТРОЙКИ'))
    after = header + 1
  }
  return { kind: 'insert', after, text }
}

/** Применяет план к тексту. Нужна для проверок; редактор вставляет строку сам. */
export function applySettingInsert(engine: string, plan: SettingPlan): string {
  if (plan.kind === 'exists') return engine
  const lines = engine.split('\n')
  lines.splice(plan.after, 0, plan.text)
  return lines.join('\n')
}
