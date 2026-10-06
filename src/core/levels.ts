import type { GuideExtra, GuideStep, StepTask } from '../lessons/types.ts'
import { partDone, stepDone, varLine } from './progress.ts'

// Уровни гайда: шаг + задания после него (по одному, по порядку). Следующий шаг открывается,
// когда пройден предыдущий уровень. Всё считается по коду, поэтому после перезагрузки прогресс тот же.

export interface LevelState {
  stepDone: boolean
  /** Какие задания шага выполнены — по порядку. */
  tasksDone: boolean[]
  /** Все задания шага выполнены. */
  taskDone: boolean
  /** Шаг и все задания выполнены. */
  done: boolean
  /** Можно вставлять код шага. */
  unlocked: boolean
}

export function taskDone(task: StepTask, codes: string[]): boolean {
  const code = codes[task.tab]
  return task.kind === 'edit' ? task.isDone(code) : task.pieces.every((p) => p.isDone(code))
}

export function levelStates(steps: GuideStep[], codes: string[]): LevelState[] {
  const out: LevelState[] = []
  steps.forEach((step, i) => {
    const s = stepDone(codes[step.tab], step.fns)
    const tasksDone = step.tasks.map((task) => s && taskDone(task, codes))
    const t = tasksDone.every(Boolean)
    // шаг, код которого уже есть, не прячем, даже если раньше что-то сломали
    const unlocked = i === 0 || out[i - 1].done || s
    out.push({ stepDone: s, tasksDone, taskDone: t, done: s && t, unlocked })
  })
  return out
}

export interface ExtraState {
  settingDone: boolean
  codeDone: boolean
  done: boolean
  unlocked: boolean
}

export function extraStates(extras: GuideExtra[], levelsDone: boolean, codes: string[]): ExtraState[] {
  const out: ExtraState[] = []
  extras.forEach((x, i) => {
    const settingDone = varLine(codes[x.setting.tab], x.setting.name) > 0
    const codeDone = x.codes.every((c) => partDone(codes[c.tab], c.marks))
    const done = settingDone && codeDone
    const unlocked = (i === 0 ? levelsDone : out[i - 1].done) || done
    out.push({ settingDone, codeDone, done, unlocked })
  })
  return out
}
