import type { Lesson } from '../types.ts'
import { GUIDE_EXTRAS, GUIDE_EXTRAS_NOTE, GUIDE_INTRO, GUIDE_MORE_TASKS, GUIDE_STEPS, GUIDE_TASKS } from './guide.ts'
import { CATCH_HINTS } from './hints.ts'
import { FINISHED, TUTORIAL } from './tabs.ts'

export const CATCH_LESSON: Lesson = {
  title: 'Лови яблоки',
  tutorial: TUTORIAL,
  finished: FINISHED,
  intro: GUIDE_INTRO,
  steps: GUIDE_STEPS,
  tasks: GUIDE_TASKS,
  extras: GUIDE_EXTRAS,
  extrasNote: GUIDE_EXTRAS_NOTE,
  moreTasks: GUIDE_MORE_TASKS,
  hints: CATCH_HINTS,
}
