// Запуск кода вкладок без браузера: заглушки document, ctx и requestAnimationFrame.
// Так проверяется логика игры — ловля, жизни, бомба, звезда, ускорение, полёт птицы.

type Listener = (e: { key: string }) => void

export interface Sim {
  /** Вычислить выражение внутри игры: sim.peek('lives'). */
  peek<T = unknown>(expr: string): T
  /** Один кадр главного цикла. */
  tick(times?: number): void
  key(key: string, down: boolean): void
  drawn: string[]
  /** Цвет каждого fillRect за последний кадр. */
  fills: string[]
  /** Цвет кисти у каждого fillText за последний кадр: полупрозрачная кисть затемняет смайлики. */
  textFills: string[]
}

export function boot(codes: string[]): Sim {
  const listeners: Record<string, Listener[]> = {}
  const document = {
    addEventListener(type: string, fn: Listener) {
      ;(listeners[type] ??= []).push(fn)
    },
  }
  // холст: Птичка слушает клик по нему
  const canvas = { addEventListener: document.addEventListener }
  const drawn: string[] = []
  const fills: string[] = []
  const textFills: string[] = []
  const saved: string[] = []
  const ctx = {
    fillStyle: '',
    font: '',
    fillRect() {
      fills.push(ctx.fillStyle)
    },
    fillText(text: string) {
      drawn.push(text)
      textFills.push(ctx.fillStyle)
    },
    save() {
      saved.push(ctx.fillStyle)
    },
    restore() {
      ctx.fillStyle = saved.pop() ?? ctx.fillStyle
    },
  }
  let next: (() => void) | null = null
  const requestAnimationFrame = (cb: () => void) => {
    next = cb
    return 1
  }
  const body = `${codes.join('\n')}\nreturn function (expr) { return eval(expr); };`
  const peek = new Function('document', 'canvas', 'ctx', 'requestAnimationFrame', body)(
    document,
    canvas,
    ctx,
    requestAnimationFrame,
  )
  return {
    peek,
    tick(times = 1) {
      for (let i = 0; i < times; i++) {
        drawn.length = 0
        fills.length = 0
        textFills.length = 0
        const cb = next
        next = null
        cb?.()
      }
    },
    key(key, down) {
      for (const fn of listeners[down ? 'keydown' : 'keyup'] ?? []) fn({ key })
    },
    drawn,
    fills,
    textFills,
  }
}
