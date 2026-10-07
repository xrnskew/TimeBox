import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import type { Picker } from '@/app/controller.ts'
import { CloseIcon } from './icons.tsx'
import styles from './EmojiPicker.module.css'

// Окно выбора смайлика или цвета у кнопки «Сменить» в коде. Системное меню эмодзи новичок не найдёт,
// а код цвета вроде #5ec639 не придумает — здесь клик, и значение само встаёт между кавычками.

const GROUPS: { title: string; list: string }[] = [
  { title: 'Звери и герои', list: '🐱 🐶 🦊 🐸 🐼 🐵 🐧 🐰 🐻 🐯 🦁 🐷 🦄 🐲 🦖 🐙 🤖 👽 👻 😎 🥷 🧙 🦸 🤠' },
  { title: 'Летают', list: '🐤 🐦 🦉 🦅 🦆 🐝 🦋 🦇 🐉 🎈 🪁' },
  { title: 'Транспорт', list: '🚀 🛸 🚗 🚲 🛹 ⛵ 🚁 🛶' },
  { title: 'Еда', list: '🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🥕 🍩 🍪 🍕 🍔 🧁 🍬 🍭 🐟' },
  { title: 'Вещи', list: '🧺 🪣 🎩 ⚽ 🏀 🎁 💎 🪙 💰 ⭐ 🌟 💣 ❤️ 🔥 ⚡ ❄️' },
]

/** Палитра для переменных …Color: значение — код цвета, подпись — для экранного диктора и подсказки. */
const COLORS: { title: string; list: [string, string][] }[] = [
  {
    title: 'Цвета',
    list: [
      ['#5ec639', 'зелёный'],
      ['#2e7d32', 'тёмно-зелёный'],
      ['#26a69a', 'бирюзовый'],
      ['#4fc3f7', 'голубой'],
      ['#1e63d6', 'синий'],
      ['#7e57c2', 'фиолетовый'],
      ['#ec407a', 'розовый'],
      ['#e53935', 'красный'],
      ['#fb8c00', 'оранжевый'],
      ['#ffca28', 'жёлтый'],
      ['#c0ca33', 'салатовый'],
      ['#8d6e63', 'коричневый'],
      ['#b0bec5', 'серый'],
      ['#ffffff', 'белый'],
      ['#ffd700', 'золотой'],
      ['#ff80ab', 'светло-розовый'],
    ],
  },
]

const WIDTH = 344
const GAP = 8
const EDGE = 12

export function EmojiPicker() {
  const picker = useApp((s) => s.picker)
  // key — новое окно на каждое открытие: своя позиция и свой фокус
  return picker ? <PickerBody key={`${picker.tab}:${picker.from}`} picker={picker} /> : null
}

function PickerBody({ picker }: { picker: Picker }) {
  const c = useController()
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // под кнопкой, а если не влезает — над ней; не вылезаем за края экрана
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const h = el.offsetHeight
    const w = Math.min(WIDTH, window.innerWidth - EDGE * 2)
    const left = Math.min(Math.max(picker.rect.left - 24, EDGE), window.innerWidth - w - EDGE)
    const below = picker.rect.bottom + GAP
    const top = below + h <= window.innerHeight - EDGE ? below : Math.max(EDGE, picker.rect.top - GAP - h)
    setPos({ left, top })
  }, [picker])

  useEffect(() => {
    box.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"], [data-value]')?.focus()
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) c.closePicker(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        c.closePicker()
      }
    }
    // прокрутили код или страницу — кнопка уехала, окно закрываем
    const onScroll = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) c.closePicker(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [c])

  const current = picker.was.trim().toLowerCase()
  const color = picker.kind === 'color'
  const heading = color ? 'Выбери цвет' : 'Выбери смайлик'

  return (
    <div
      ref={box}
      className={styles.picker}
      role="dialog"
      aria-label={heading}
      style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
    >
      <div className={styles.head}>
        <p>{heading}</p>
        <button
          type="button"
          className="key key--s key--icon key--ghost"
          aria-label="Закрыть"
          onClick={() => c.closePicker()}
        >
          <CloseIcon size={12} />
        </button>
      </div>
      <div className={styles.groups}>
        {color &&
          COLORS.map((g) => (
            <section key={g.title} aria-label={g.title}>
              <div className={styles.colorGrid}>
                {g.list.map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.color}
                    style={{ background: value }}
                    data-value={value}
                    aria-label={name}
                    title={name}
                    aria-pressed={value === current}
                    onClick={() => c.pickEmoji(value)}
                  />
                ))}
              </div>
            </section>
          ))}
        {!color &&
          GROUPS.map((g) => (
            <section key={g.title} aria-label={g.title}>
              <h3>{g.title}</h3>
              <div className={styles.grid}>
                {g.list.split(' ').map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={styles.emoji}
                    data-value={e}
                    aria-pressed={e === current}
                    onClick={() => c.pickEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
