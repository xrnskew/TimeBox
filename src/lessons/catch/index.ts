import type { Lesson } from '../types.ts'
import { GUIDE_EXTRAS, GUIDE_EXTRAS_NOTE, GUIDE_INTRO, GUIDE_STEPS } from './guide.ts'
import { CATCH_HINTS } from './hints.ts'
import { FINISHED, TUTORIAL } from './tabs.ts'

export const CATCH_LESSON: Lesson = {
  title: 'Catch',
  tutorial: TUTORIAL,
  finished: FINISHED,
  intro: GUIDE_INTRO,
  steps: GUIDE_STEPS,
  extras: GUIDE_EXTRAS,
  extrasNote: GUIDE_EXTRAS_NOTE,
  hints: CATCH_HINTS,
}
