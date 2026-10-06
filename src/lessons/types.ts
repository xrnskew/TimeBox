// Описание урока. Ядро песочницы ничего не знает про яблоки: всё, что относится
// к конкретной игре, лежит в пакете урока (src/lessons/<id>/).

export interface TabDef {
  id: string
  /** Название вкладки: «Движок», «Герой»… */
  title: string
  /** Номер шага, если вкладка — шаг гайда. */
  step?: number
  /** Однострочная подсказка над редактором. */
  note: string
}

export interface LessonVariant {
  id: 'tutorial' | 'finished'
  /** Ключ localStorage для кода. Активная вкладка — `${storageKey}:active`. */
  storageKey: string
  tabs: TabDef[]
  initial: string[]
  hasGuide: boolean
  /** Список «Что тут есть» под игрой (только в готовой версии). */
  features?: string[]
}

/**
 * Текст гайда: абзац, в котором `код` — инлайн-код, а [[Ctrl+Z]] — клавиша.
 */
export type Rich = string

export interface GuideStep {
  step: number
  /** Индекс вкладки, куда вставляется код. */
  tab: number
  title: string
  /** Одна строка: что получится после шага. */
  lead: Rich
  /** «Как это работает» — открывается по кнопке. */
  how: Rich[]
  code: string
  /** Что проверить после запуска — коротко. */
  checks: Rich[]
  /** Функции, которые должны быть объявлены и не пустые. */
  fns: string[]
  /** Задание после шага. Следующий шаг открывается, только когда оно выполнено. */
  task: StepTask
}

/** Куда вставить кусок кода: после строки `after` (с 1). */
export interface InsertPlan {
  after: number
  text: string
}

/** Задание «поправь сам»: кнопка открывает вкладку и выделяет, что менять. */
export interface EditTask {
  kind: 'edit'
  title: string
  text: Rich
  tab: number
  /** Что выделить в коде: первая группа регулярного выражения (флаг d). */
  target: RegExp
  hint: Rich[]
  isDone: (code: string) => boolean
}

/** Кусок функции, который добавляется кнопкой. */
export interface BuildPiece {
  title: string
  /** Куда и что вставить (вставка всплывает в коде призраком); null — пока нельзя (нет предыдущей части). */
  plan: (code: string) => InsertPlan | null
  isDone: (code: string) => boolean
}

/** Задание «собери по частям»: функция собирается кнопками кусок за куском. */
export interface BuildTask {
  kind: 'build'
  title: string
  text: Rich
  tab: number
  pieces: BuildPiece[]
}

export type StepTask = EditTask | BuildTask

export interface GuideExtra {
  n: number
  emoji: string
  title: string
  text: Rich
  /** Одна строка в «Движок». */
  setting: { tab: number; name: string; line: string }
  /** Код для нескольких вкладок — вставляется одной кнопкой. */
  codes: { tab: number; code: string; marks: RegExp[] }[]
}

export interface GuideIntro {
  title: string
  lead: Rich
  /** Короткие подсказки с клавишами. */
  tips: Rich[]
}

export interface Hint {
  name: string
  kind: 'variable' | 'function' | 'property' | 'method' | 'constant'
  /** Короткая подпись в списке автодополнения, например `(x, y)`. */
  detail?: string
  text: string
}

export interface HintSet {
  globals: Hint[]
  /** Подсказки после точки: `ctx.`, `Math.`, `console.`… */
  members: Record<string, Hint[]>
  /** Переменные, которые показываются в «Приборах». */
  watch: string[]
}

export interface Lesson {
  title: string
  tutorial: LessonVariant
  finished: LessonVariant
  intro: GuideIntro
  steps: GuideStep[]
  extras: GuideExtra[]
  /** Предупреждение под бомбой и звездой. */
  extrasNote: Rich
  hints: HintSet
}
