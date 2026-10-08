import { type CSSProperties, useEffect, useRef } from 'react'
import type { ExtraState, LevelState } from '@/core/levels.ts'
import { INK } from '@/core/pictures.ts'
import type { Lesson } from '@/lessons/types.ts'
import { CheckIcon, LockIcon } from './icons.tsx'
import { Pic } from './Pic.tsx'
import styles from './Roadmap.module.css'

// Карта игры над гайдом — как карта уровней в настоящих играх. Дорога петляет от станции к станции: шаги,
// бонусные задания и финиш с подарком. Пройденный кусок дороги жёлтый, текущая станция пульсирует, над ней — стрелка.
// Нажал станцию — гайд прокручивается к ней. Всё считается по тем же квестам, что и гайд.

type State = 'done' | 'now' | 'open' | 'locked'

interface Station {
  key: string
  kind: 'step' | 'extra' | 'finish'
  /** Номер шага — только у шагов: это последовательность. */
  n?: number
  title: string
  pic: string
  state: State
  /** id блока гайда, к которому прокрутить. */
  target: string
}

const STATE_TEXT: Record<State, string> = {
  done: 'пройдено',
  now: 'ты здесь',
  open: 'открыто',
  locked: 'закрыто',
}

function stations(lesson: Lesson, levels: LevelState[], extras: ExtraState[]): Station[] {
  const list: Station[] = [
    ...lesson.steps.map((s, i) => ({
      key: `s${s.step}`,
      kind: 'step' as const,
      n: s.step,
      title: s.title,
      pic: s.pic,
      state: (levels[i].done ? 'done' : levels[i].unlocked ? 'open' : 'locked') as State,
      target: `guide-step-${s.step}`,
    })),
    ...lesson.extras.map((x, i) => ({
      key: `x${x.n}`,
      kind: 'extra' as const,
      title: x.title,
      pic: x.pic,
      state: (extras[i].done ? 'done' : extras[i].unlocked ? 'open' : 'locked') as State,
      target: `guide-task-${x.n}`,
    })),
  ]
  const all = list.every((s) => s.state === 'done')
  list.push({
    key: 'finish',
    kind: 'finish',
    title: 'Финиш',
    pic: 'подарок',
    state: all ? 'done' : 'locked',
    target: 'guide-finish',
  })
  // ты здесь — первая открытая станция; всё пройдено — финиш
  const here = list.findIndex((s) => s.state === 'open')
  list[here >= 0 ? here : list.length - 1].state = here >= 0 ? 'now' : 'done'
  return list
}

/** Стрелка «ты здесь» по клеткам: k — контур, y — жёлтая. */
const ARROW = [
  '..kkkkk..',
  '..kyyyk..',
  '..kyyyk..',
  'kkkyyykkk',
  'kyyyyyyyk',
  '.kyyyyyk.',
  '..kyyyk..',
  '...kyk...',
  '....k....',
]

/** Где станция на карте, в процентах: дорога идёт слева направо волной — вверх, вниз, вверх… */
function spot(i: number, count: number) {
  const pad = 9
  return { x: pad + (i * (100 - 2 * pad)) / Math.max(1, count - 1), y: i % 2 ? 34 : 64 }
}

/** Дорога через точки: плавные изгибы, ручки — по горизонтали. */
function road(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`
      const prev = points[i - 1]
      const mid = (p.x - prev.x) / 2
      return `C${prev.x + mid} ${prev.y} ${p.x - mid} ${p.y} ${p.x} ${p.y}`
    })
    .join('')
}

export function Roadmap({ lesson, levels, extras }: { lesson: Lesson; levels: LevelState[]; extras: ExtraState[] }) {
  const list = stations(lesson, levels, extras)
  const points = list.map((_, i) => spot(i, list.length))
  const here = Math.max(
    0,
    list.findIndex((s) => s.state === 'now'),
  )
  const atFinish = list.every((s) => s.state === 'done')
  const at = atFinish ? list.length - 1 : here
  // на узком экране карта шире окна и листается вбок: текущая станция — посередине
  const land = useRef<HTMLDivElement>(null)
  const atX = points[at].x
  useEffect(() => {
    const el = land.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth * atX) / 100 - el.clientWidth / 2
  }, [atX])
  const current = list[at]
  const level = current.kind === 'step' ? levels[(current.n ?? 1) - 1] : null
  const step = current.kind === 'step' ? lesson.steps[(current.n ?? 1) - 1] : null

  const go = (target: string) => {
    const el = document.getElementById(target)
    if (!el) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav className={styles.map} aria-label="Карта игры">
      <p className={styles.where} aria-live="polite">
        {atFinish ? (
          <>Игра собрана целиком! Поиграй сам или открой готовую версию внизу.</>
        ) : current.kind === 'step' && step && level ? (
          <>
            Ты здесь: шаг {current.n} «{current.title}»
            {level.current >= 0 && (
              <span className={styles.quest}>
                квест {level.current + 1} из {step.quests.length}
              </span>
            )}
          </>
        ) : (
          <>Бонус: «{current.title}». Основная игра уже собрана.</>
        )}
      </p>

      <div className={styles.land} ref={land}>
        <div className={styles.world}>
          <svg className={styles.road} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={road(points)} className={styles.roadBed} vectorEffect="non-scaling-stroke" />
            <path d={road(points)} className={styles.roadTiles} vectorEffect="non-scaling-stroke" />
            {at > 0 && (
              <path d={road(points.slice(0, at + 1))} className={styles.roadDone} vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          <ol className={styles.stations}>
            {list.map((s, i) => (
              <li
                key={s.key}
                className={styles.station}
                data-kind={s.kind}
                data-state={s.state}
                data-row={i % 2 ? 'top' : 'bottom'}
                style={{ '--x': `${points[i].x}%`, '--y': `${points[i].y}%` } as CSSProperties}
              >
                <button
                  type="button"
                  className={styles.pad}
                  onClick={() => go(s.target)}
                  aria-current={s.state === 'now' ? 'step' : undefined}
                  aria-label={`${s.kind === 'step' ? `Шаг ${s.n}: ` : s.kind === 'extra' ? 'Бонус: ' : ''}${s.title} — ${STATE_TEXT[s.state]}`}
                >
                  <Pic name={s.pic} className={styles.padPic} />
                  {s.kind === 'step' && <span className={styles.num}>{s.n}</span>}
                  {s.state === 'done' && (
                    <span className={styles.flag}>
                      <CheckIcon size={11} />
                    </span>
                  )}
                  {s.state === 'locked' && (
                    <span className={styles.flag}>
                      <LockIcon size={10} />
                    </span>
                  )}
                </button>
                <span className={styles.label} aria-hidden="true">
                  {s.title}
                </span>
              </li>
            ))}
          </ol>

          {/* пиксельная стрелка над текущей станцией; станция сменилась — стрелка переезжает туда */}
          <svg
            className={styles.arrow}
            viewBox="0 0 9 9"
            shapeRendering="crispEdges"
            style={{ '--x': `${points[at].x}%`, '--y': `${points[at].y}%` } as CSSProperties}
            aria-hidden="true"
          >
            {ARROW.flatMap((row, y) =>
              [...row].map((ch, x) =>
                ch === '.' ? null : (
                  <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={ch === 'k' ? INK : 'var(--sun)'} />
                ),
              ),
            )}
          </svg>
        </div>
      </div>
    </nav>
  )
}
