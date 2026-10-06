import { useEffect, useMemo, useRef } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { extrasDone, levelsDone } from '@/app/controller.ts'
import { CheckIcon, LogoApple, PlayIcon, ResetIcon } from './icons.tsx'
import styles from './Header.module.css'

export function Header() {
  const c = useController()
  const tutorial = c.variant.hasGuide

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <LogoApple className={styles.logo} />
        <span className={styles.name}>TimeBox</span>
        {!tutorial && <span className={styles.tag}>готовая игра</span>}
      </div>

      {tutorial ? (
        <Checkpoints />
      ) : (
        <a className={`key key--s ${styles.back}`} href={location.pathname}>
          Учебная версия
        </a>
      )}

      <div className={styles.actions}>
        <button type="button" className="key key--ghost key--s" onClick={() => c.openDialog({ kind: 'resetAll' })}>
          <ResetIcon size={13} />
          <span className={styles.wideOnly}>Сбросить всё</span>
        </button>
        <button
          type="button"
          className={`key key--apple key--l ${styles.run}`}
          onClick={c.run}
          aria-keyshortcuts="Control+Enter"
        >
          <PlayIcon size={15} />
          Запустить
          <span className={styles.shortcut} aria-hidden="true">
            Ctrl+Enter
          </span>
        </button>
      </div>
    </header>
  )
}

/** Чек-поинты: три шага (зелёные) и бомба со звездой (жёлтые) в одном ряду. Учитель видит прогресс издалека. */
function Checkpoints() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const levels = useMemo(() => levelsDone(c, codes), [c, codes])
  const extras = useMemo(() => extrasDone(c, codes), [c, codes])
  const points = [
    ...c.lesson.steps.map((step, i) => ({
      key: `step-${step.step}`,
      kind: 'step' as const,
      label: c.variant.tabs[step.tab].title,
      aria: `Шаг ${step.step}, «${c.variant.tabs[step.tab].title}»`,
      target: `guide-step-${step.step}`,
      done: levels[i],
    })),
    ...c.lesson.extras.map((x, i) => ({
      key: `extra-${x.n}`,
      kind: 'extra' as const,
      label: x.title,
      aria: `Дополнительно: «${x.title}»`,
      target: `guide-task-${x.n}`,
      done: extras[i],
    })),
  ]
  const done = points.map((p) => p.done)
  const count = done.filter(Boolean).length
  const prev = useRef<boolean[] | null>(null)
  const marks = useRef<(HTMLSpanElement | null)[]>([])
  const counter = useRef<HTMLSpanElement | null>(null)
  const doneKey = done.join()

  // Единственная анимация без действия ученика: чек-поинт пройден — галочка подпрыгивает.
  useEffect(() => {
    const now = doneKey.split(',').map((d) => d === 'true')
    const before = prev.current
    prev.current = now
    if (!before) return
    let any = false
    now.forEach((d, i) => {
      if (d && !before[i]) {
        any = true
        marks.current[i]?.classList.add(styles.justDone)
      }
    })
    if (any) counter.current?.classList.add(styles.pop)
  }, [doneKey])

  const open = (id: string) => {
    c.selectView('guide')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  return (
    <nav className={styles.progress} aria-label="Прогресс">
      <ol className={styles.points}>
        {points.map((p, i) => (
          <li key={p.key} data-kind={p.kind}>
            <button
              type="button"
              className={styles.point}
              data-kind={p.kind}
              data-done={p.done}
              onClick={() => open(p.target)}
              aria-label={`${p.aria}: ${p.done ? 'сделано' : 'не сделано'}`}
            >
              <span
                ref={(el) => {
                  marks.current[i] = el
                }}
                className={styles.mark}
                onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.justDone)}
              >
                {p.done && <CheckIcon size={13} />}
              </span>
              <span className={styles.label}>{p.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <span
        ref={counter}
        className={styles.count}
        onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.pop)}
        aria-live="polite"
      >
        {count}/{points.length}
      </span>
    </nav>
  )
}
