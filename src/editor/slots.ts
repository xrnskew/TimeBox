import type { EditorState } from '@codemirror/state'
import { StateField } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view'
import './slots.css'

// Кусок кода, который добавляют кнопкой прямо в редакторе. Он «всплывает» призраком
// под строкой, куда встанет, — ученик видит место вставки, а не ищет его по гайду.
// Что и где показывать, решает урок: редактор только рисует и зовёт onAdd.

export interface CodeSlot {
  /** Строка (с 1), под которой появится кусок. */
  after: number
  /** Что будет вставлено — показывается призраком. */
  code: string
  /** Номер части и сколько всего, например 2 и 4. */
  n: number
  total: number
  title: string
  onAdd: () => void
}

/** По коду вкладки — какой кусок предложить сейчас (или ничего). */
export type SlotSource = (code: string) => CodeSlot | null

const PLUS =
  '<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'

class SlotWidget extends WidgetType {
  readonly slot: CodeSlot
  constructor(slot: CodeSlot) {
    super()
    this.slot = slot
  }

  // та же часть с тем же кодом — DOM не пересоздаём, и анимация появления не повторяется
  eq(other: SlotWidget) {
    return other.slot.n === this.slot.n && other.slot.code === this.slot.code
  }

  toDOM() {
    const { slot } = this
    const wrap = document.createElement('div')
    wrap.className = 'cm-slot'
    const box = document.createElement('div')
    box.className = 'cm-slotBox'
    box.setAttribute('role', 'group')
    box.setAttribute('aria-label', `Часть ${slot.n} из ${slot.total}: ${slot.title}`)

    const head = document.createElement('div')
    head.className = 'cm-slotHead'
    const num = document.createElement('span')
    num.className = 'cm-slotNum'
    num.textContent = `${slot.n}/${slot.total}`
    const title = document.createElement('span')
    title.className = 'cm-slotTitle'
    title.textContent = slot.title
    const add = document.createElement('button')
    add.type = 'button'
    add.className = 'key key--sun key--s cm-slotAdd'
    add.setAttribute('aria-label', `Добавить: ${slot.title}`)
    add.innerHTML = `${PLUS}<span>Добавить</span>`
    add.addEventListener('click', () => slot.onAdd())
    head.append(num, title, add)

    const code = document.createElement('div')
    code.className = 'cm-slotCode'
    code.textContent = slot.code
    code.setAttribute('aria-hidden', 'true')

    box.append(head, code)
    wrap.append(box)
    return wrap
  }

  // клики по кнопке не должны двигать курсор редактора
  ignoreEvent() {
    return true
  }
}

export function codeSlots(source: SlotSource) {
  const build = (state: EditorState): DecorationSet => {
    const slot = source(state.doc.toString())
    if (!slot) return Decoration.none
    const line = state.doc.line(Math.min(Math.max(slot.after, 1), state.doc.lines))
    return Decoration.set([Decoration.widget({ widget: new SlotWidget(slot), block: true, side: 1 }).range(line.to)])
  }
  return StateField.define<DecorationSet>({
    create: build,
    update: (deco, tr) => (tr.docChanged ? build(tr.state) : deco),
    provide: (f) => EditorView.decorations.from(f),
  })
}
