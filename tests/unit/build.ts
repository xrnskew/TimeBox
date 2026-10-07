import { expect } from 'vitest'
import { applySettingInsert, planSettingInsert } from '@/core/insert.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import type { BuildTask, InsertPlan } from '@/lessons/types.ts'

// Сборка по кусочкам без редактора и строка настройки в «Движок» — общие для квестов всех игр.

/** То же, что делает редактор: вставить текст после строки plan.after. */
export function apply(code: string, plan: InsertPlan): string {
  const lines = code.split('\n')
  lines.splice(plan.after, 0, ...plan.text.split('\n'))
  return lines.join('\n')
}

/** Собрать все части по порядку, как кнопками «Добавить». Каждая промежуточная версия — без ошибок. */
export function build(code: string, ...tasks: BuildTask[]): string {
  for (const task of tasks)
    for (const piece of task.pieces) {
      expect(piece.isDone(code), piece.title).toBe(false)
      const plan = piece.plan(code)
      expect(plan, piece.title).not.toBeNull()
      code = apply(code, plan!)
      expect(piece.isDone(code), piece.title).toBe(true)
      expect(findSyntaxError(code), piece.title).toBeNull()
    }
  return code
}

/** То же, что кнопка «Добавить переменную в «Движок»» в дополнительном задании. */
export const withSetting = (engine: string, name: string, line: string) =>
  applySettingInsert(engine, planSettingInsert(engine, name, line))
