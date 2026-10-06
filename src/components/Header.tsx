import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { stepsDone } from '@/app/controller.ts'
import { AppleIcon, EyeIcon, PlayIcon, ResetIcon, ShareIcon } from './icons.tsx'
import styles from './Header.module.css'

export function Header() {
  const c = useController()
  const tutorial = c.variant.hasGuide

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          🍎
        </span>
        <span className={styles.name}>{c.lesson.title}</span>
        <span className={styles.tag}>{tutorial ? 'песочница' : 'готовая версия'}</span>
      </div>

      {tutorial && <StepBranch />}

      <div className={styles.actions}>
        <ViewMenu />
        <button type="button" className={`btn btn--ghost ${styles.tool}`} onClick={() => void c.openShare()}>
          <ShareIcon />
          <span className={styles.wideOnly}>Поделиться</span>
        </button>
        <button
          type="button"
          className={`btn btn--ghost ${styles.tool}`}
          onClick={() => c.openDialog({ kind: 'resetAll' })}
        >
          <ResetIcon />
          <span className={styles.wideOnly}>Сбросить всё</span>
        </button>
        <span className={styles.shortcut} aria-hidden="true">
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
        </span>
        <button
          type="button"
          className={`btn btn--primary ${styles.run}`}
          onClick={c.run}
          aria-keyshortcuts="Control+Enter"
        >
          <PlayIcon />
          Запустить
        </button>
      </div>
    </header>
  )
}

/** Ветка с тремя яблоками: сделанный шаг — зелёное яблоко. Учитель видит прогресс издалека. */
function StepBranch() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const done = useMemo(() => stepsDone(c, codes), [c, codes])
  const count = done.filter(Boolean).length
  const prev = useRef<boolean[] | null>(null)
  const apples = useRef<(HTMLSpanElement | null)[]>([])
  const counter = useRef<HTMLSpanElement | null>(null)

  // Единственная анимация без действия ученика: шаг засчитан — яблоко падает в корзинку.
  useEffect(() => {
    const before = prev.current
    prev.current = done
    if (!before) return
    let any = false
    done.forEach((d, i) => {
      if (d && !before[i]) {
        any = true
        apples.current[i]?.classList.add(styles.justRipe)
      }
    })
    if (any) counter.current?.classList.add(styles.pop)
  }, [done])

  const openStep = (n: number) => {
    c.selectView('guide')
    setTimeout(
      () => document.getElementById(`guide-step-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      30,
    )
  }

  return (
    <nav className={styles.branch} aria-label="Прогресс по шагам">
      <svg className={styles.twig} viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M2 6 C 50 2, 90 12, 140 6 S 190 4, 198 8"
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <ol className={styles.apples}>
        {c.lesson.steps.map((step, i) => (
          <li key={step.step}>
            <button
              type="button"
              className={styles.apple}
              onClick={() => openStep(step.step)}
              aria-label={`Шаг ${step.step}, «${c.variant.tabs[step.tab].title}»: ${done[i] ? 'сделан' : 'не сделан'}`}
            >
              <span
                ref={(el) => {
                  apples.current[i] = el
                }}
                className={styles.appleBody}
                onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.justRipe)}
              >
                <AppleIcon ripe={done[i]} />
              </span>
              <span className={done[i] ? styles.labelDone : styles.label}>{c.variant.tabs[step.tab].title}</span>
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
        {count}/{c.lesson.steps.length}
      </span>
    </nav>
  )
}

function ViewMenu() {
  const c = useController()
  const prefs = useApp((s) => s.prefs)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const other = c.variant.hasGuide
    ? { href: '?finished', text: 'Открыть готовую игру' }
    : { href: location.pathname, text: 'Вернуться к учебной версии' }

  return (
    <div className={`${styles.menuRoot} ${styles.tool}`} ref={root}>
      <button
        type="button"
        className="btn btn--ghost"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
      >
        <EyeIcon />
        <span className={styles.wideOnly}>Вид</span>
      </button>
      {open && (
        <div className={styles.menu} role="group" aria-label="Вид">
          <button
            type="button"
            className={styles.menuRow}
            aria-pressed={prefs.projector}
            onClick={() => c.setPrefs({ projector: !prefs.projector })}
          >
            <span>
              Режим проектора
              <small>Светлая тема — её хорошо видно на экране в классе</small>
            </span>
            <span className={styles.switch} data-on={prefs.projector} aria-hidden="true" />
          </button>
          <div className={styles.menuRow}>
            <span>Размер кода</span>
            <span className={styles.stepper}>
              <button
                type="button"
                className="btn btn--outline btn--small btn--icon"
                aria-label="Мельче"
                disabled={prefs.codeSize <= 11}
                onClick={() => c.setPrefs({ codeSize: prefs.codeSize - 1 })}
              >
                −
              </button>
              <output aria-live="polite">{prefs.codeSize}</output>
              <button
                type="button"
                className="btn btn--outline btn--small btn--icon"
                aria-label="Крупнее"
                disabled={prefs.codeSize >= 24}
                onClick={() => c.setPrefs({ codeSize: prefs.codeSize + 1 })}
              >
                +
              </button>
            </span>
          </div>
          <a
            className={styles.menuLink}
            href={other.href}
            target={c.variant.hasGuide ? '_blank' : undefined}
            rel="noreferrer"
          >
            {other.text}
          </a>
        </div>
      )}
    </div>
  )
}
