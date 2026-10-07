import type { Lesson } from '../types.ts'
import { GUIDE_EXTRAS, GUIDE_EXTRAS_NOTE, GUIDE_INTRO, GUIDE_STEPS } from './guide.ts'
import { CATCH_HINTS } from './hints.ts'
import { FINISHED, TUTORIAL } from './tabs.ts'

export const CATCH_LESSON: Lesson = {
  id: 'catch',
  title: 'Catch',
  card: {
    level: 'Очень легко',
    levelBars: 1,
    blurb:
      'Сверху падают яблоки, а твой герой их ловит. Собери игру по кусочкам: героя, яблоки, поимку — а потом добавь бомбу и звезду.',
    hero: '🧺',
    item: '🍎',
    heroVar: 'playerEmoji',
    itemVar: 'itemEmoji',
    scene: 'catch',
  },
  consoleColor: 'green',
  controls: {
    buttons: [
      { key: 'ArrowLeft', label: 'Влево', icon: 'left' },
      { key: 'ArrowRight', label: 'Вправо', icon: 'right' },
    ],
    keysHint: '← →',
    hitboxes: 'Показать зону поимки и точки, которые проверяет checkCatch',
  },
  tutorial: TUTORIAL,
  finished: FINISHED,
  intro: GUIDE_INTRO,
  steps: GUIDE_STEPS,
  extras: GUIDE_EXTRAS,
  extrasTitle: 'Бомба и звезда',
  extrasNote: GUIDE_EXTRAS_NOTE,
  hints: CATCH_HINTS,
}
