import { syntaxTree } from '@codemirror/language'
import type { EditorState, Range } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view'

// Кнопка «Сменить» рядом со смайликом в кавычках: `var playerEmoji = "🙂";`. Новичку трудно открыть
// системное меню эмодзи (Win + . или ПКМ → «Эмодзи»), поэтому смайлик выбирают из окна по клику.
// Так же меняют цвет: у переменной `var pipeColor = "#5ec639";` кнопка с квадратиком цвета открывает палитру.
// Окно рисует приложение, редактор только говорит, какие символы заменить.

/** Что выбирают в окне: смайлик или цвет. */
export type PickKind = 'emoji' | 'color'

export interface EmojiSpot {
  /** Что заменить: содержимое кавычек, [from, to). */
  from: number
  to: number
  kind: PickKind
  /** Куда прикрепить окно выбора. */
  rect: { left: number; top: number; bottom: number }
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|\u200d|\ufe0f|\u20e3)+$/u
const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u
/** Строка объявляет смайлик: `var itemEmoji = ` — кнопка есть, даже если в кавычках пусто. */
const EMOJI_VAR = /\b\w*Emoji\s*=\s*$/
/** Строка объявляет цвет: `var pipeColor = `. Просто "#141414" в коде кнопку не получает — её было бы слишком много. */
const COLOR_VAR = /\b\w*Color\s*=\s*$/

/** Нужна ли кнопка у строки в кавычках: внутри только смайлик, или это переменная …Emoji. */
export function isEmojiString(content: string, before: string): boolean {
  const t = content.trim()
  return EMOJI_VAR.test(before) || (EMOJI_ONLY.test(t) && PICTO.test(t))
}

/** Нужна ли кнопка выбора цвета: строка — значение переменной …Color. */
export const isColorString = (before: string) => COLOR_VAR.test(before)

type Spot = { from: number; to: number; kind: PickKind }

/** Строки в кавычках со смайликом или цветом в диапазоне [from, to): позиции содержимого (без кавычек). */
export function emojiStrings(state: EditorState, from = 0, to = state.doc.length): Spot[] {
  const out: Spot[] = []
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
      if (isColorString(before)) out.push({ from: node.from + 1, to: node.to - 1, kind: 'color' })
      else if (isEmojiString(content, before)) out.push({ from: node.from + 1, to: node.to - 1, kind: 'emoji' })
      return false
    },
  })
  return out
}

const FACE =
  '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5.8" cy="6.6" r="0.95" fill="currentColor"/><circle cx="10.2" cy="6.6" r="0.95" fill="currentColor"/><path d="M5.3 9.6c.7 1 1.6 1.5 2.7 1.5s2-.5 2.7-1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'

class PickWidget extends WidgetType {
  readonly onPick: (view: EditorView, spot: EmojiSpot) => void
  readonly kind: PickKind
  /** Цвет для квадратика на кнопке (только у цвета). */
  readonly color: string
  constructor(onPick: (view: EditorView, spot: EmojiSpot) => void, kind: PickKind, color = '') {
    super()
    this.onPick = onPick
    this.kind = kind
    this.color = color
  }

  // позиция берётся в момент клика, поэтому кнопки смайликов одинаковые и DOM не пересоздаётся;
  // у цвета на кнопке квадратик — его перерисовываем, когда цвет поменялся
  eq(other: PickWidget) {
    return other.kind === this.kind && other.color === this.color
  }

  toDOM(view: EditorView) {
    const btn = document.createElement('button')
    btn.type = 'button'
    if (this.kind === 'color') {
      btn.className = 'cm-colorPick'
      btn.title = 'Выбрать цвет'
      btn.setAttribute('aria-label', 'Сменить цвет')
      const swatch = document.createElement('span')
      swatch.className = 'cm-colorSwatch'
      swatch.style.background = this.color
      btn.append(swatch, Object.assign(document.createElement('span'), { textContent: 'Сменить' }))
    } else {
      btn.className = 'cm-emojiPick'
      btn.title = 'Выбрать смайлик'
      btn.setAttribute('aria-label', 'Сменить смайлик')
      btn.innerHTML = `${FACE}<span>Сменить</span>`
    }
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

/** Кнопки «Сменить» после закрывающей кавычки у каждого смайлика и цвета на экране. */
export function emojiPickers(onPick: (view: EditorView, spot: EmojiSpot) => void) {
  const emoji = new PickWidget(onPick, 'emoji')
  const build = (view: EditorView): DecorationSet => {
    const marks: Range<Decoration>[] = []
    for (const { from, to } of view.visibleRanges)
      for (const s of emojiStrings(view.state, from, to)) {
        const widget =
          s.kind === 'color' ? new PickWidget(onPick, 'color', view.state.doc.sliceString(s.from, s.to).trim()) : emoji
        marks.push(Decoration.widget({ widget, side: 1 }).range(s.to + 1))
      }
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
