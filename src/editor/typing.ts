import { type Range, StateEffect, StateField } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view'
import './typing.css'

// Кусок, добавленный кнопкой, «печатается» на глазах. Сам код вставляется сразу целиком — сохранение,
// проверки и отмена видят его как есть; печать только визуальная: ещё не «напечатанные» символы
// прозрачные, а перед ними мигает курсор. Любая правка во время печати показывает всё сразу.

export interface Typing {
  from: number
  to: number
  /** До какого символа уже «напечатано». */
  pos: number
}

/** Начать печать куска [from, to) — в той же транзакции, что и вставка. */
export const startTyping = StateEffect.define<{ from: number; to: number }>()
/** Напечатано до символа pos. */
export const typeTo = StateEffect.define<number>()
export const stopTyping = StateEffect.define<null>()

class CaretWidget extends WidgetType {
  eq() {
    return true
  }
  toDOM() {
    const caret = document.createElement('span')
    caret.className = 'cm-typingCaret'
    caret.setAttribute('aria-hidden', 'true')
    return caret
  }
}

const caret = Decoration.widget({ widget: new CaretWidget(), side: -1 })
const hidden = Decoration.mark({ class: 'cm-typingHidden' })

function decorate(t: Typing | null): DecorationSet {
  if (!t) return Decoration.none
  const marks: Range<Decoration>[] = [caret.range(t.pos)]
  if (t.pos < t.to) marks.push(hidden.range(t.pos, t.to))
  return Decoration.set(marks, true)
}

export const typingField = StateField.define<Typing | null>({
  create: () => null,
  update(t, tr) {
    for (const e of tr.effects) {
      if (e.is(startTyping)) return e.value.to > e.value.from ? { ...e.value, pos: e.value.from } : null
      if (e.is(stopTyping)) return null
      if (e.is(typeTo) && t) return e.value >= t.to ? null : { ...t, pos: e.value }
    }
    return tr.docChanged ? null : t
  },
  provide: (f) => EditorView.decorations.from(f, decorate),
})

/** Сколько длится печать куска из `len` символов, мс: быстро для строчки, не дольше 1,2 с для блока. */
export const typingDuration = (len: number) => Math.min(1200, Math.max(320, len * 16))

/** Печатать кусок в `view`: курсор бежит по символам, пробелы отступа пролетают сразу. */
export function animateTyping(view: EditorView, onDone: () => void): () => void {
  const t0 = view.state.field(typingField, false)
  if (!t0) {
    onDone()
    return () => {}
  }
  const text = view.state.sliceDoc(t0.from, t0.to)
  const duration = typingDuration(text.length)
  const start = performance.now()
  let raf = 0
  const step = (now: number) => {
    const t = view.state.field(typingField, false)
    // правка, смена вкладки или отмена — печать закончилась
    if (!t || t.from !== t0.from || t.to !== t0.to) {
      onDone()
      return
    }
    let n = Math.floor((text.length * (now - start)) / duration)
    while (n < text.length && /\s/.test(text[n])) n++
    view.dispatch({ effects: typeTo.of(t0.from + n) })
    if (n >= text.length) {
      onDone()
      return
    }
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}
