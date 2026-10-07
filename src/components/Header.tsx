import { useEffect, useMemo, useRef } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { extrasDone, levelsDone, runQuestNow } from '@/app/controller.ts'
import { gameHref, homeHref } from '@/app/routes.ts'
import { CheckIcon, LogoCube, PlayIcon, ResetIcon } from './icons.tsx'
import styles from './Header.module.css'

export function Header() {
  const c = useController()
  const tutorial = c.variant.hasGuide

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <a className={styles.home} href={homeHref()} title="В главное меню" aria-label="TimeBox — в главное меню">
          <LogoCube className={styles.logo} />
          <span className={styles.name}>TimeBox</span>
        </a>
        {tutorial ? (
          <span className={styles.tagline}>конструктор игр</span>
        ) : (
          <span className={styles.tag}>готовая игра</span>
        )}
      </div>

      {tutorial ? (
        <Checkpoints />
      ) : (
        <a className={`key key--s ${styles.back}`} href={gameHref(c.lesson.id)}>
          Учебная версия
        </a>
      )}

      <div className={styles.actions}>
        <button type="button" className="key key--ghost key--s" onClick={() => c.openDialog({ kind: 'resetAll' })}>
          <ResetIcon size={13} />
          <span className={styles.wideOnly}>Сбросить всё</span>
        </button>
        <RunButton />
      </div>
    </header>
  )
}

/**
 * «Собрать». Есть несобранные изменения — кнопка подпрыгивает. В квесте «Собери игру» всё вокруг
 * темнеет, а кнопка светится поверх: первый раз ученик должен её найти.
 */
function RunButton() {
  const c = useController()
  const dirty = useApp((s) => s.codes.some((code, i) => code !== s.ran[i]))
  const codes = useApp((s) => s.codes)
  const ran = useApp((s) => s.ran)
  const off = useApp((s) => s.spotOff || s.dialog !== null)
  const quest = useMemo(() => runQuestNow(c, codes, ran), [c, codes, ran])
  const spot = quest !== null && !off
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!spot) return
    button.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') c.dismissSpot()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spot, c])

  return (
    <span className={styles.runWrap}>
      {spot && <div className={styles.dim} aria-hidden="true" onClick={c.dismissSpot} />}
      <button
        ref={button}
        type="button"
        className={`key key--apple key--l ${styles.run}`}
        data-dirty={dirty && !spot}
        data-spot={spot}
        onClick={c.run}
        aria-keyshortcuts="Control+Enter"
        aria-describedby={spot ? 'run-callout' : undefined}
        title={dirty ? 'Есть изменения — собери игру, чтобы увидеть их' : undefined}
      >
        <PlayIcon size={15} />
        Собрать
        <span className={styles.shortcut} aria-hidden="true">
          Ctrl+Enter
        </span>
        {dirty && !spot && <span className="visually-hidden"> — есть несобранные изменения</span>}
      </button>
      {spot && (
        <div className={styles.callout} id="run-callout" role="status">
          <p>{quest.callout}</p>
          <button type="button" className="key key--s key--ghost" onClick={c.dismissSpot}>
            Позже
          </button>
        </div>
      )}
    </span>
  )
}

/** Чек-поинты: три шага (зелёные) и бомба со звездой (жёлтые) в одном ряду. Учитель видит прогресс издалека. */
function Checkpoints() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const ran = useApp((s) => s.ran)
  const levels = useMemo(() => levelsDone(c, codes, ran), [c, codes, ran])
  const extras = useMemo(() => extrasDone(c, codes, ran), [c, codes, ran])
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
