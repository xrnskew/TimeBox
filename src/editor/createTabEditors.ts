import { autocompletion } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory, redo, undo } from '@codemirror/commands'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language'
import { lintGutter } from '@codemirror/lint'
import {
  Annotation,
  EditorState,
  type Extension,
  Prec,
  StateEffect,
  StateField,
  type TransactionSpec,
} from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { classHighlighter } from '@lezer/highlight'
import type { SyntaxIssue } from '@/core/syntax.ts'
import type { HintSet } from '@/lessons/types.ts'
import { hintCompletions, hintHover, syntaxLinter } from './assist.ts'
import { type EmojiSpot, emojiPickers } from './emoji.ts'
import './emoji.css'
import { codeSlots, refreshSlots, type SlotSource } from './slots.ts'
import { editorTheme } from './theme.ts'

// Один EditorView и по одному EditorState на вкладку. История отмены живёт в EditorState,
// поэтому у каждой вкладки своя история, и Ctrl+Z в «Герое» не трогает «Движок».

/** Правка из программы (вставка из гайда, сброс), а не от ученика. */
const programmatic = Annotation.define<boolean>()

// ===== Подсветка строки с ошибкой: сбрасывается при любой правке =====
const setErrorLine = StateEffect.define<number | null>()
const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (!e.is(setErrorLine)) continue
      if (e.value == null) return Decoration.none
      const n = Math.min(Math.max(e.value, 1), tr.state.doc.lines)
      return Decoration.set([Decoration.line({ class: 'cm-errorLine' }).range(tr.state.doc.line(n).from)])
    }
    return tr.docChanged ? Decoration.none : deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

// ===== Только что вставленные строки: короткая подсветка, гаснет при следующей правке =====
const setFlash = StateEffect.define<{ from: number; to: number }>()
const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (!e.is(setFlash)) continue
      const doc = tr.state.doc
      const marks = []
      for (let n = Math.max(e.value.from, 1); n <= Math.min(e.value.to, doc.lines); n++)
        marks.push(Decoration.line({ class: 'cm-flash' }).range(doc.line(n).from))
      return Decoration.set(marks)
    }
    return tr.docChanged ? Decoration.none : deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

export interface TabEditorsOptions {
  parent: HTMLElement
  docs: string[]
  active: number
  hints: HintSet
  lint: (code: string) => SyntaxIssue | null
  /** Код вкладки изменился. byUser — печатает ученик, а не программа. */
  onChange: (tab: number, byUser: boolean) => void
  onRun: () => void
  /** Куски, которые всплывают в коде вкладки с кнопкой «Добавить» (по одному источнику на вкладку). */
  slots?: (SlotSource | null)[]
  /** Нажали «Сменить» у смайлика в открытой вкладке. */
  onEmoji?: (tab: number, spot: EmojiSpot) => void
}

export interface TabEditors {
  readonly current: number
  show(tab: number): void
  setVisible(visible: boolean): void
  getCode(tab: number): string
  getCodes(): string[]
  /** Заменить вкладку целиком — одной отдельной записью в истории. */
  replace(tab: number, code: string): void
  /** Вставить строку после строки `after` (0 — в начало). Возвращает номер новой строки. */
  insertLine(tab: number, after: number, text: string): number
  undo(tab: number): boolean
  markError(tab: number, line: number | null): void
  clearErrors(): void
  /** Перейти к строке: курсор, прокрутка, фокус. Вкладка должна быть открыта. */
  gotoLine(line: number): void
  /** Выделить кусок строки (столбцы с 0) и прокрутить к нему. Вкладка должна быть открыта. */
  select(line: number, from: number, to: number): void
  /** Прокрутить к строке, не трогая курсор и фокус. Вкладка должна быть открыта. */
  reveal(line: number): void
  /** Заменить кусок [from, to) как правку ученика — отдельной записью в истории. Вкладка должна быть открыта. */
  replaceRange(from: number, to: number, text: string): void
  /** Позиция начала строки `line`, столбец `col` (с 0) — в открытой вкладке. */
  posOf(line: number, col: number): number
  /** Где на экране символ `pos` открытой вкладки; null — не виден. */
  coordsAt(pos: number): { left: number; top: number; bottom: number } | null
  /** Пересчитать всплывающие куски: квест мог смениться без правки в этой вкладке. */
  refreshSlots(): void
  focus(): void
  destroy(): void
}

export function createTabEditors(o: TabEditorsOptions): TabEditors {
  let current = o.active
  const scrollTops = o.docs.map(() => 0)

  const run = () => {
    o.onRun()
    return true
  }

  const extensions: Extension[] = [
    // Prec.highest — иначе Ctrl+Enter перехватит insertBlankLine
    Prec.highest(
      keymap.of([
        { key: 'Mod-Enter', run },
        { key: 'Ctrl-Enter', run },
      ]),
    ),
    lineNumbers(),
    lintGutter(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    indentOnInput(),
    bracketMatching(),
    javascript(),
    syntaxHighlighting(classHighlighter),
    EditorState.tabSize.of(2),
    indentUnit.of('  '),
    autocompletion({ icons: false }),
    javascriptLanguage.data.of({ autocomplete: hintCompletions(o.hints) }),
    hintHover(o.hints),
    syntaxLinter(o.lint),
    errorLineField,
    flashField,
    // На Mac по умолчанию работает только Cmd — Ctrl задаём явно
    keymap.of([
      { key: 'Ctrl-z', run: undo, preventDefault: true },
      { key: 'Ctrl-Shift-z', run: redo, preventDefault: true },
      { key: 'Ctrl-y', run: redo, preventDefault: true },
      indentWithTab,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    editorTheme,
    emojiPickers((_, spot) => o.onEmoji?.(current, spot)),
    EditorView.contentAttributes.of({ 'aria-label': 'Код вкладки', spellcheck: 'false', autocapitalize: 'off' }),
    EditorView.updateListener.of((u) => {
      if (!u.docChanged) return
      const byUser = u.transactions.some((tr) => tr.docChanged && !tr.annotation(programmatic))
      o.onChange(current, byUser)
    }),
  ]

  const states = o.docs.map((doc, tab) => {
    const slots = o.slots?.[tab]
    return EditorState.create({ doc, extensions: slots ? [extensions, codeSlots(slots)] : extensions })
  })
  const view = new EditorView({ state: states[current], parent: o.parent })

  const stateOf = (tab: number) => (tab === current ? view.state : states[tab])

  // Правка вкладки, которая сейчас не открыта, применяется к её сохранённому EditorState.
  function apply(tab: number, spec: TransactionSpec) {
    if (tab === current) {
      view.dispatch(spec)
      return
    }
    states[tab] = states[tab].update(spec).state
    if (spec.changes) o.onChange(tab, false)
  }

  return {
    get current() {
      return current
    },
    show(tab) {
      if (tab === current) return
      states[current] = view.state
      scrollTops[current] = view.scrollDOM.scrollTop
      current = tab
      view.setState(states[tab])
      view.dispatch({ effects: refreshSlots.of(null) })
      const top = scrollTops[tab]
      requestAnimationFrame(() => {
        view.scrollDOM.scrollTop = top
      })
    },
    setVisible(visible) {
      o.parent.hidden = !visible
      if (visible) view.requestMeasure()
    },
    getCode: (tab) => stateOf(tab).doc.toString(),
    getCodes: () => o.docs.map((_, tab) => stateOf(tab).doc.toString()),
    replace(tab, code) {
      const state = stateOf(tab)
      apply(tab, {
        changes: { from: 0, to: state.doc.length, insert: code },
        selection: { anchor: 0 },
        scrollIntoView: true,
        annotations: [isolateHistory.of('full'), programmatic.of(true)],
      })
    },
    insertLine(tab, after, text) {
      const doc = stateOf(tab).doc
      const n = Math.min(after, doc.lines)
      const changes = n === 0 ? { from: 0, insert: `${text}\n` } : { from: doc.line(n).to, insert: `\n${text}` }
      const lineNo = n + 1
      // подсвечиваем только строки с кодом: пустая строка-отступ перед куском не в счёт
      const lead = /^\n*/.exec(text)?.[0].length ?? 0
      apply(tab, {
        changes,
        effects: setFlash.of({ from: lineNo + lead, to: lineNo + text.split('\n').length - 1 }),
        annotations: [isolateHistory.of('full'), programmatic.of(true)],
      })
      return lineNo + lead
    },
    undo(tab) {
      if (tab === current) return undo(view)
      const ok = undo({
        state: states[tab],
        dispatch: (tr) => {
          states[tab] = tr.state
        },
      })
      if (ok) o.onChange(tab, false)
      return ok
    },
    markError(tab, line) {
      apply(tab, { effects: setErrorLine.of(line) })
    },
    clearErrors() {
      o.docs.forEach((_, tab) => apply(tab, { effects: setErrorLine.of(null) }))
    },
    gotoLine(line) {
      const doc = view.state.doc
      const l = doc.line(Math.min(Math.max(line, 1), doc.lines))
      view.dispatch({
        selection: { anchor: l.from + (/^\s*/.exec(l.text)?.[0].length ?? 0) },
        effects: EditorView.scrollIntoView(l.from, { y: 'center' }),
      })
      view.focus()
    },
    select(line, from, to) {
      const doc = view.state.doc
      const l = doc.line(Math.min(Math.max(line, 1), doc.lines))
      const a = Math.min(l.from + from, l.to)
      const b = Math.min(l.from + to, l.to)
      view.dispatch({ selection: { anchor: a, head: b }, effects: EditorView.scrollIntoView(a, { y: 'center' }) })
      view.focus()
    },
    reveal(line) {
      const doc = view.state.doc
      const l = doc.line(Math.min(Math.max(line, 1), doc.lines))
      view.dispatch({ effects: EditorView.scrollIntoView(l.to, { y: 'center' }) })
    },
    replaceRange(from, to, text) {
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
        annotations: isolateHistory.of('full'),
        userEvent: 'input.emoji',
      })
    },
    posOf(line, col) {
      const l = view.state.doc.line(Math.min(Math.max(line, 1), view.state.doc.lines))
      return Math.min(l.from + col, l.to)
    },
    coordsAt(pos) {
      const r = view.coordsAtPos(pos)
      return r ? { left: r.left, top: r.top, bottom: r.bottom } : null
    },
    refreshSlots() {
      view.dispatch({ effects: refreshSlots.of(null) })
    },
    focus() {
      view.focus()
    },
    destroy() {
      view.destroy()
    },
  }
}
