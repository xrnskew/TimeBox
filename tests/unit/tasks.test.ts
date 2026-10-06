import { describe, expect, it } from 'vitest'
import { extraStates, levelStates } from '@/core/levels.ts'
import { checkFinishedPassword } from '@/core/lock.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import { GUIDE_EXTRAS, GUIDE_STEPS } from '@/lessons/catch/guide.ts'
import {
  BOMB_APPLES,
  BOMB_CATCH,
  BOMB_LINE,
  GOLD_APPLES,
  GOLD_CATCH,
  GOLD_LINE,
  STEP_APPLES,
  STEP_CATCH,
  STEP_HERO,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/catch/tabs.ts'
import { BASKET_TASK, editTarget, SPEEDUP_TASK, TEN_POINTS_TASK } from '@/lessons/catch/tasks.ts'
import type { InsertPlan } from '@/lessons/types.ts'
import { boot } from './sim.ts'

/** То же, что делает редактор: вставить текст после строки plan.after. */
function apply(code: string, plan: InsertPlan): string {
  const lines = code.split('\n')
  lines.splice(plan.after, 0, ...plan.text.split('\n'))
  return lines.join('\n')
}

const engineWith = (emoji: string) =>
  TUTORIAL_ENGINE.replace('var playerEmoji = "🧺";', `var playerEmoji = "${emoji}";`)

describe('задание шага 1: своя корзина', () => {
  it('засчитано, только когда смайлик другой', () => {
    expect(BASKET_TASK.isDone(TUTORIAL_ENGINE)).toBe(false)
    expect(BASKET_TASK.isDone(engineWith('🐱'))).toBe(true)
    expect(BASKET_TASK.isDone(engineWith(''))).toBe(false)
    expect(BASKET_TASK.isDone(`// var playerEmoji = "🐱";\n${TUTORIAL_ENGINE}`)).toBe(false)
  })

  it('кнопка выделяет сам смайлик', () => {
    const at = editTarget(TUTORIAL_ENGINE, BASKET_TASK.target)!
    expect(at.line).toBe(5)
    expect(TUTORIAL_ENGINE.split('\n')[4].slice(at.from, at.to)).toBe('🧺')
  })
})

describe('задание шага 2: «Всё быстрее» по частям', () => {
  const [shell, cond, step, call] = SPEEDUP_TASK.pieces

  it('части нельзя добавить раньше предыдущих', () => {
    expect(cond.plan(STEP_APPLES)).toBeNull()
    expect(step.plan(STEP_APPLES)).toBeNull()
    expect(call.plan(STEP_APPLES)).toBeNull()
  })

  it('собранная функция работает: каждые 15 секунд быстрее, но не быстрее 8', () => {
    let code = STEP_APPLES
    for (const piece of SPEEDUP_TASK.pieces) {
      expect(piece.isDone(code)).toBe(false)
      code = apply(code, piece.plan(code)!)
      expect(piece.isDone(code)).toBe(true)
    }
    expect(findSyntaxError(code)).toBeNull()
    expect(shell.isDone(code) && cond.isDone(code) && step.isDone(code) && call.isDone(code)).toBe(true)
    expect(code).toContain('  frame = frame + 1;\n  speedUp();')

    const sim = boot([engineWith('🐱'), STEP_HERO, code, STEP_CATCH])
    sim.peek('lives = 1000000')
    sim.tick(899)
    expect(sim.peek('fallSpeed')).toBe(4)
    sim.tick(900 * 10)
    expect(sim.peek('fallSpeed')).toBe(8)
  })
})

describe('задание шага 3: десять очков', () => {
  it('засчитано, когда яблоко даёт 10', () => {
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH)).toBe(false)
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH.replace('score = score + 1;', 'score = score + 10;'))).toBe(true)
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH.replace('score = score + 1;', 'score += 10;'))).toBe(true)
  })

  it('кнопка выделяет число очков', () => {
    const at = editTarget(STEP_CATCH, TEN_POINTS_TASK.target)!
    expect(STEP_CATCH.split('\n')[at.line - 1].slice(at.from, at.to)).toBe('1')
  })
})

describe('шаги открываются по очереди', () => {
  it('в начале открыт только шаг 1', () => {
    expect(levelStates(GUIDE_STEPS, TUTORIAL_CODES).map((l) => l.unlocked)).toEqual([true, false, false])
  })

  it('шаг 2 открывается после кода шага 1 и своей корзины', () => {
    const codes = [TUTORIAL_ENGINE, STEP_HERO, TUTORIAL_CODES[2], TUTORIAL_CODES[3]]
    expect(levelStates(GUIDE_STEPS, codes)[1].unlocked).toBe(false)
    codes[0] = engineWith('🐱')
    const levels = levelStates(GUIDE_STEPS, codes)
    expect(levels[0]).toMatchObject({ stepDone: true, taskDone: true, done: true })
    expect(levels[1].unlocked).toBe(true)
    expect(levels[2].unlocked).toBe(false)
  })

  it('бомба и звезда закрыты, пока игра не собрана; звезда — ещё и до бомбы', () => {
    expect(extraStates(GUIDE_EXTRAS, false, TUTORIAL_CODES).map((x) => x.unlocked)).toEqual([false, false])
    expect(extraStates(GUIDE_EXTRAS, true, TUTORIAL_CODES).map((x) => x.unlocked)).toEqual([true, false])
    const engine = `${engineWith('🐱')}\n${BOMB_LINE}`
    const withBomb = [engine, STEP_HERO, BOMB_APPLES, BOMB_CATCH]
    expect(extraStates(GUIDE_EXTRAS, true, withBomb).map((x) => x.unlocked)).toEqual([true, true])
    const withStar = [`${engine}\n${GOLD_LINE}`, STEP_HERO, GOLD_APPLES, GOLD_CATCH]
    expect(extraStates(GUIDE_EXTRAS, true, withStar).map((x) => x.done)).toEqual([true, true])
  })

  it('код бомбы и звезды сохраняет ускорение и 10 очков', () => {
    const levels = levelStates(GUIDE_STEPS, [engineWith('🐱'), STEP_HERO, GOLD_APPLES, GOLD_CATCH])
    expect(levels.every((l) => l.done)).toBe(true)
  })
})

describe('пароль готовой игры', () => {
  it('подходит только 000110', () => {
    expect(checkFinishedPassword('000110')).toBe(true)
    expect(checkFinishedPassword(' 000110 ')).toBe(true)
    for (const wrong of ['', '000111', '00011', '0001100', '110000']) expect(checkFinishedPassword(wrong)).toBe(false)
  })
})
