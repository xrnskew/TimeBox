import { BIRD_LESSON } from './bird/index.ts'
import { CATCH_LESSON } from './catch/index.ts'
import type { Lesson } from './types.ts'

/** Все игры конструктора — в таком порядке они стоят в главном меню. */
export const LESSONS: Lesson[] = [CATCH_LESSON, BIRD_LESSON]

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id) ?? null
