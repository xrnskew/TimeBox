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

export interface TabEditorsOptions {
  parent: HTMLElement
  docs: string[]
  active: number
  hints: HintSet
  lint: (code: string) => SyntaxIssue | null
  /** Код вкладки изменился. byUser — печатает ученик, а не программа. */
  onChange: (tab: number, byUser: boolean) => void
  onRun: () => void
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
    EditorView.contentAttributes.of({ 'aria-label': 'Код вкладки', spellcheck: 'false', autocapitalize: 'off' }),
    EditorView.updateListener.of((u) => {
      if (!u.docChanged) return
      const byUser = u.transactions.some((tr) => tr.docChanged && !tr.annotation(programmatic))
      o.onChange(current, byUser)
    }),
  ]

  const states = o.docs.map((doc) => EditorState.create({ doc, extensions }))
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
      apply(tab, {
        changes,
        annotations: [isolateHistory.of('full'), programmatic.of(true)],
      })
      return lineNo
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
    focus() {
      view.focus()
    },
    destroy() {
      view.destroy()
    },
  }
}
