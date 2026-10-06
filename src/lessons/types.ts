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
}

export interface GuideTask {
  n: number
  title: string
  text: Rich
  hint: Rich[]
}

export type GuidePart =
  | {
      mode: 'settings'
      title: string
      tab: number
      /** Имя переменной и строка, которая добавляется в «Движок». */
      name: string
      line: string
    }
  | {
      mode: 'replace'
      title: string
      tab: number
      code: string
      /** Признак «уже есть в коде» — проверяется по коду без комментариев. */
      marks: RegExp[]
    }

export interface GuideExtra {
  n: number
  emoji: string
  title: string
  text: Rich
  parts: GuidePart[]
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
  tasks: GuideTask[]
  extras: GuideExtra[]
  /** Предупреждение под бомбой и звездой. */
  extrasNote: Rich
  /** Задания после бомбы и звезды. */
  moreTasks: GuideTask[]
  hints: HintSet
}
