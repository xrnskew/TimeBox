import { type CSSProperties, useMemo } from 'react'
import { extraStates, levelStates } from '@/core/levels.ts'
import { stripComments } from '@/core/progress.ts'
import { gameHref } from '@/app/routes.ts'
import { LESSONS } from '@/lessons/index.ts'
import type { Lesson } from '@/lessons/types.ts'
import { loadCodes } from '@/sandbox/storage.ts'
import { CheckIcon, LockIcon, LogoCube, PlayIcon } from './icons.tsx'
import styles from './Home.module.css'

// Главное меню: выбор игры. Каждая игра — карточка с маленькой приставкой, на экране которой
// игра идёт сама; прогресс берётся из сохранения этой игры в браузере.

export function Home() {
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <LogoCube className={styles.logo} />
        <span className={styles.name}>TimeBox</span>
        <span className={styles.tagline}>конструктор игр</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Выбери игру</h1>
        <p className={styles.lead}>
          Игра собирается по квестам: добавляешь кусочек кода, жмёшь «Собрать» — и сразу видишь, что получилось.
        </p>

        <ul className={styles.games} aria-label="Игры">
          {LESSONS.map((lesson) => (
            <li key={lesson.id}>
              <GameCard lesson={lesson} />
            </li>
          ))}
          <li className={styles.soon} aria-label="Скоро">
            <LockIcon size={22} />
            <p>Здесь появятся новые игры</p>
          </li>
        </ul>

        <p className={styles.note}>Прогресс каждой игры сохраняется в этом браузере.</p>
      </main>
    </div>
  )
}

interface Progress {
  started: boolean
  marks: { kind: 'step' | 'extra'; done: boolean }[]
  hero: string
  item: string
}

/** Смайлик из последнего объявления `var name = "…"` во всех вкладках (поздние вкладки побеждают). */
function emojiOf(codes: string[], name: string): string | null {
  const re = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(["'])(.*?)\\1`, 'gm')
  let found: string | null = null
  for (const code of codes) for (const m of stripComments(code).matchAll(re)) found = m[2].trim() || found
  return found
}

function progressOf(lesson: Lesson): Progress {
  const v = lesson.tutorial
  const codes = loadCodes(v.storageKey, v.tabs.length) ?? v.initial
  const levels = levelStates(lesson.steps, codes)
  const extras = extraStates(
    lesson.extras,
    levels.every((l) => l.done),
    codes,
  )
  return {
    started: codes.some((c, i) => c !== v.initial[i]),
    marks: [
      ...levels.map((l) => ({ kind: 'step' as const, done: l.done })),
      ...extras.map((x) => ({ kind: 'extra' as const, done: x.done })),
    ],
    hero: emojiOf(codes, lesson.card.heroVar) ?? lesson.card.hero,
    item: emojiOf(codes, lesson.card.itemVar) ?? lesson.card.item,
  }
}

function GameCard({ lesson }: { lesson: Lesson }) {
  const p = useMemo(() => progressOf(lesson), [lesson])
  const done = p.marks.filter((m) => m.done).length
  const all = done === p.marks.length
  const id = `game-${lesson.id}`

  return (
    <article className={styles.card} aria-labelledby={id}>
      <Attract hero={p.hero} item={p.item} />
      <div className={styles.info}>
        <h2 id={id}>{lesson.title}</h2>
        <p className={styles.level}>
          <span className={styles.bars} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} data-on={i < lesson.card.levelBars} />
            ))}
          </span>
          {lesson.card.level}
        </p>
        <p className={styles.blurb}>{lesson.card.blurb}</p>

        <div className={styles.progress}>
          <ol className={styles.marks} aria-hidden="true">
            {p.marks.map((m, i) => (
              <li key={i} data-kind={m.kind} data-done={m.done}>
                {m.done && <CheckIcon size={11} />}
              </li>
            ))}
          </ol>
          <span>
            {done === 0
              ? p.started
                ? 'Начата'
                : 'Ещё не начата'
              : all
                ? 'Пройдена целиком'
                : `Пройдено ${done} из ${p.marks.length}`}
          </span>
        </div>

        <a className={`key key--apple key--l ${styles.play}`} href={gameHref(lesson.id)}>
          <PlayIcon size={15} />
          {p.started ? 'Продолжить' : 'Начать'}
          <span className="visually-hidden"> {lesson.title}</span>
        </a>
      </div>
    </article>
  )
}

/** Маленькая приставка: игра идёт сама — яблоки падают, герой успевает под каждое. */
function Attract({ hero, item }: { hero: string; item: string }) {
  return (
    <div className={styles.console} aria-hidden="true">
      <div className={styles.bezel}>
        <div className={styles.screen}>
          {[22, 72, 45].map((x, i) => (
            <span key={i} className={styles.item} style={{ '--x': `${x}%`, '--i': i } as CSSProperties}>
              {item}
            </span>
          ))}
          <span className={styles.hero}>{hero}</span>
        </div>
      </div>
      <div className={styles.pad}>
        <span />
        <span />
      </div>
    </div>
  )
}
