import { useEffect, useMemo, useRef } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { stepsDone } from '@/app/controller.ts'
import { AppleIcon, LogoApple, PlayIcon, ResetIcon } from './icons.tsx'
import styles from './Header.module.css'

export function Header() {
  const c = useController()
  const tutorial = c.variant.hasGuide

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <LogoApple className={styles.logo} />
        <span className={styles.name}>{c.lesson.title}</span>
        {!tutorial && <span className={styles.tag}>готовая игра</span>}
      </div>

      {tutorial ? (
        <StepApples />
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

/** Три яблока — три шага: сделанный шаг зеленеет. Учитель видит прогресс издалека. */
function StepApples() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const done = useMemo(() => stepsDone(c, codes), [c, codes])
  const count = done.filter(Boolean).length
  const prev = useRef<boolean[] | null>(null)
  const apples = useRef<(HTMLSpanElement | null)[]>([])
  const counter = useRef<HTMLSpanElement | null>(null)

  // Единственная анимация без действия ученика: шаг засчитан — яблоко подпрыгивает и зеленеет.
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
    <nav className={styles.progress} aria-label="Прогресс по шагам">
      <ol className={styles.apples}>
        {c.lesson.steps.map((step, i) => (
          <li key={step.step}>
            <button
              type="button"
              className={styles.apple}
              data-done={done[i]}
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
              <span className={styles.label}>{c.variant.tabs[step.tab].title}</span>
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
