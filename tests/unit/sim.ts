// Запуск кода вкладок без браузера: заглушки document, ctx и requestAnimationFrame.
// Так проверяется логика игры — ловля, жизни, бомба, звезда, ускорение, полёт птицы, пули и пришельцы.

type Listener = (e: { key: string }) => void

export interface Sim {
  /** Вычислить выражение внутри игры: sim.peek('lives'). */
  peek<T = unknown>(expr: string): T
  /** Один кадр главного цикла. */
  tick(times?: number): void
  key(key: string, down: boolean): void
  /** Всё, что нарисовано за последний кадр: текст из fillText и имена картинок из drawImage(picture(…)). */
  drawn: string[]
  /** Цвет каждого fillRect за последний кадр. */
  fills: string[]
  /** Цвет кисти у каждого fillText за последний кадр: полупрозрачная кисть затемняет смайлики. */
  textFills: string[]
  /** Прозрачность (globalAlpha) у каждого fillText за последний кадр: луна Космоса полупрозрачная. */
  textAlphas: number[]
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
  const textAlphas: number[] = []
  const saved: { fillStyle: string; globalAlpha: number }[] = []
  const ctx = {
    fillStyle: '',
    globalAlpha: 1,
    font: '',
    fillRect() {
      fills.push(ctx.fillStyle)
    },
    fillText(text: string) {
      drawn.push(text)
      textFills.push(ctx.fillStyle)
      textAlphas.push(ctx.globalAlpha)
    },
    drawImage(img: { pic: string }) {
      drawn.push(img.pic)
      textFills.push(ctx.fillStyle)
      textAlphas.push(ctx.globalAlpha)
    },
    save() {
      saved.push({ fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha })
    },
    restore() {
      const top = saved.pop()
      if (top) Object.assign(ctx, top)
    },
  }
  let next: (() => void) | null = null
  const requestAnimationFrame = (cb: () => void) => {
    next = cb
    return 1
  }
  const body = `${codes.join('\n')}\nreturn function (expr) { return eval(expr); };`
  // картинка из набора — как в обвязке; здесь только её имя
  const picture = (name: string) => ({ pic: String(name) })
  const peek = new Function('document', 'canvas', 'ctx', 'requestAnimationFrame', 'picture', body)(
    document,
    canvas,
    ctx,
    requestAnimationFrame,
    picture,
  )
  return {
    peek,
    tick(times = 1) {
      for (let i = 0; i < times; i++) {
        drawn.length = 0
        fills.length = 0
        textFills.length = 0
        textAlphas.length = 0
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
    textAlphas,
  }
}
