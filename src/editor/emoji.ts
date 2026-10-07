import { syntaxTree } from '@codemirror/language'
import type { EditorState, Range } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view'

// Кнопка «Сменить» рядом со смайликом в кавычках: `var playerEmoji = "🙂";`. Новичку трудно открыть
// системное меню эмодзи (Win + . или ПКМ → «Эмодзи»), поэтому смайлик выбирают из окна по клику.
// Окно рисует приложение, редактор только говорит, какие символы заменить.

export interface EmojiSpot {
  /** Что заменить: содержимое кавычек, [from, to). */
  from: number
  to: number
  /** Куда прикрепить окно выбора. */
  rect: { left: number; top: number; bottom: number }
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|\u200d|\ufe0f|\u20e3)+$/u
const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u
/** Строка объявляет смайлик: `var itemEmoji = ` — кнопка есть, даже если в кавычках пусто. */
const EMOJI_VAR = /\b\w*Emoji\s*=\s*$/

/** Нужна ли кнопка у строки в кавычках: внутри только смайлик, или это переменная …Emoji. */
export function isEmojiString(content: string, before: string): boolean {
  const t = content.trim()
  return EMOJI_VAR.test(before) || (EMOJI_ONLY.test(t) && PICTO.test(t))
}

/** Строки в кавычках со смайликом в диапазоне [from, to): позиции содержимого (без кавычек). */
export function emojiStrings(state: EditorState, from = 0, to = state.doc.length): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = []
  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (node.name !== 'String') return
      const quote = state.doc.sliceString(node.from, node.from + 1)
      if (node.to - node.from < 2 || state.doc.sliceString(node.to - 1, node.to) !== quote) return false
      const line = state.doc.lineAt(node.from)
      if (line.number !== state.doc.lineAt(node.to).number) return false
      const content = state.doc.sliceString(node.from + 1, node.to - 1)
      const before = state.doc.sliceString(line.from, node.from)
      if (isEmojiString(content, before)) out.push({ from: node.from + 1, to: node.to - 1 })
      return false
    },
  })
  return out
}

const FACE =
  '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5.8" cy="6.6" r="0.95" fill="currentColor"/><circle cx="10.2" cy="6.6" r="0.95" fill="currentColor"/><path d="M5.3 9.6c.7 1 1.6 1.5 2.7 1.5s2-.5 2.7-1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'

class PickWidget extends WidgetType {
  readonly onPick: (view: EditorView, spot: EmojiSpot) => void
  constructor(onPick: (view: EditorView, spot: EmojiSpot) => void) {
    super()
    this.onPick = onPick
  }

  // позиция берётся в момент клика, поэтому все кнопки одинаковые и DOM не пересоздаётся
  eq() {
    return true
  }

  toDOM(view: EditorView) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cm-emojiPick'
    btn.title = 'Выбрать смайлик'
    btn.setAttribute('aria-label', 'Сменить смайлик')
    btn.innerHTML = `${FACE}<span>Сменить</span>`
    // не даём редактору забрать фокус и сдвинуть курсор
    btn.addEventListener('mousedown', (e) => e.preventDefault())
    btn.addEventListener('click', () => {
      const pos = view.posAtDOM(btn)
      const line = view.state.doc.lineAt(pos)
      const spot = emojiStrings(view.state, line.from, line.to).find((s) => s.to + 1 === pos)
      if (!spot) return
      const r = btn.getBoundingClientRect()
      this.onPick(view, { ...spot, rect: { left: r.left, top: r.top, bottom: r.bottom } })
    })
    return btn
  }

  ignoreEvent() {
    return true
  }
}

/** Кнопки «Сменить» после закрывающей кавычки у каждого смайлика на экране. */
export function emojiPickers(onPick: (view: EditorView, spot: EmojiSpot) => void) {
  const widget = new PickWidget(onPick)
  const build = (view: EditorView): DecorationSet => {
    const marks: Range<Decoration>[] = []
    for (const { from, to } of view.visibleRanges)
      for (const s of emojiStrings(view.state, from, to))
        marks.push(Decoration.widget({ widget, side: 1 }).range(s.to + 1))
    return Decoration.set(marks, true)
  }
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = build(view)
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state))
          this.decorations = build(u.view)
      }
    },
    { decorations: (v) => v.decorations },
  )
}
