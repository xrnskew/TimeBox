import { memo, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { type FnState, partDone, stepStates, varLine } from '@/core/progress.ts'
import type { GuideExtra, GuidePart, GuideStep, GuideTask } from '@/lessons/types.ts'
import { CodeBlock } from './CodeBlock.tsx'
import { BulbIcon, CheckIcon, CodeIcon, HelpIcon, InsertIcon, WarnIcon } from './icons.tsx'
import { Rich } from './Rich.tsx'
import styles from './Guide.module.css'

// Гайд заменяет презентацию: ученик идёт в своём темпе. Текста мало, подробности —
// по кнопкам. Не размонтируется, чтобы помнить прокрутку.
export function Guide() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const { lesson } = c
  const total = lesson.steps.length

  return (
    <article className={styles.guide}>
      <header className={styles.hero}>
        <h1>{lesson.intro.title}</h1>
        <p className={styles.lead}>
          <Rich text={lesson.intro.lead} />
        </p>
        <ul className={styles.tips}>
          {lesson.intro.tips.map((t) => (
            <li key={t}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </header>

      <ol className={styles.track} aria-label="Шаги">
        {lesson.steps.map((step, i) => (
          <StepItem key={step.step} index={i} step={step} total={total} code={codes[step.tab]} />
        ))}
      </ol>

      <section className={styles.section} aria-labelledby="guide-tasks">
        <h2 id="guide-tasks">Сделай игру своей</h2>
        <p className={styles.sub}>Тут без готового кода — попробуй сам.</p>
        <div className={styles.tiles}>
          {lesson.tasks.map((t) => (
            <TaskTile key={t.n} task={t} />
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="guide-extras">
        <h2 id="guide-extras">Бомба и звезда</h2>
        <p className={styles.sub}>Тут код есть: три части по порядку, запускай после каждой.</p>
        <div className={styles.extras}>
          {lesson.extras.map((x, i) => (
            <Extra key={x.n} index={i} extra={x} codes={codes} />
          ))}
        </div>
        <p className={styles.warn}>
          <WarnIcon size={15} className={styles.warnIcon} />
          <span>
            <Rich text={lesson.extrasNote} />
          </span>
        </p>
      </section>

      {lesson.moreTasks.length > 0 && (
        <section className={styles.section} aria-labelledby="guide-more">
          <h2 id="guide-more">Ещё одно</h2>
          <div className={styles.tiles}>
            {lesson.moreTasks.map((t) => (
              <TaskTile key={t.n} task={t} />
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <a className="key" href="?finished" target="_blank" rel="noreferrer">
          Открыть готовую игру
        </a>
        <span>Бомба, звезда и ускорение. У неё своё сохранение — твой код она не тронет.</span>
      </footer>
    </article>
  )
}

const FN_TEXT: Record<FnState, string> = {
  ok: 'есть, внутри есть код',
  empty: 'есть, но внутри пусто',
  missing: 'функции пока нет',
}

const StepItem = memo(function StepItem({
  index,
  step,
  total,
  code,
}: {
  index: number
  step: GuideStep
  total: number
  code: string
}) {
  const c = useController()
  const [showCode, setShowCode] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const tabTitle = c.variant.tabs[step.tab].title
  const states = stepStates(code, step.fns)
  const done = states.every((s) => s.state === 'ok')
  const id = `guide-step-${step.step}`

  return (
    <li id={id} className={styles.step} data-done={done}>
      <span className={styles.node} aria-hidden="true">
        {done ? <CheckIcon size={22} /> : step.step}
      </span>
      <div className={styles.stepBody}>
        <div className={styles.stepHead}>
          <h2 id={`${id}-title`}>
            <span className="visually-hidden">
              Шаг {step.step} из {total}.{' '}
            </span>
            {step.title}
          </h2>
          {done ? (
            <span className="chip chip--ok">
              <CheckIcon size={12} />
              Сделано
            </span>
          ) : (
            <span className="chip chip--todo">Не сделано</span>
          )}
        </div>
        <p className={styles.stepLead}>
          <Rich text={step.lead} />
        </p>

        <ul className={styles.fns} aria-label={`Что должно быть во вкладке «${tabTitle}»`}>
          {states.map((s) => (
            <li key={s.name} data-state={s.state} title={`${s.name} — ${FN_TEXT[s.state]}`}>
              {s.state === 'ok' ? <CheckIcon size={12} /> : <span className={styles.dot} aria-hidden="true" />}
              <code>{s.name}</code>
              <span className="visually-hidden"> — {FN_TEXT[s.state]}</span>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className="key key--apple key--l" onClick={() => c.insertStep(index)}>
            <InsertIcon size={16} />
            Вставить в «{tabTitle}»
          </button>
          <button type="button" className="key key--l" aria-expanded={showCode} onClick={() => setShowCode(!showCode)}>
            <CodeIcon size={16} />
            {showCode ? 'Скрыть код' : 'Показать код'}
          </button>
          <button
            type="button"
            className="key key--l key--ghost"
            aria-expanded={showHow}
            onClick={() => setShowHow(!showHow)}
          >
            <HelpIcon size={16} />
            Как это работает
          </button>
        </div>

        {showHow && (
          <ul className={styles.how}>
            {step.how.map((t, i) => (
              <li key={i}>
                <Rich text={t} />
              </li>
            ))}
          </ul>
        )}
        {showCode && (
          <div className={styles.code}>
            <CodeBlock code={step.code} />
            <p className={styles.aside}>Можно не вставлять, а перепечатать руками — так лучше запомнится.</p>
          </div>
        )}

        <ul className={styles.checks} aria-label="Проверь">
          {step.checks.map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
})

function TaskTile({ task }: { task: GuideTask }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.tile}>
      <span className={styles.tileNum} aria-hidden="true">
        {task.n}
      </span>
      <h3>
        <span className="visually-hidden">Задание {task.n}. </span>
        {task.title}
      </h3>
      <p>
        <Rich text={task.text} />
      </p>
      <button type="button" className="key key--s" aria-expanded={open} onClick={() => setOpen(!open)}>
        <BulbIcon size={13} />
        {open ? 'Скрыть подсказку' : 'Подсказка'}
      </button>
      {open && (
        <div className={styles.hint}>
          {task.hint.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function isPartDone(part: GuidePart, codes: string[]) {
  const code = codes[part.tab]
  return part.mode === 'settings' ? varLine(code, part.name) > 0 : partDone(code, part.marks)
}

const Extra = memo(function Extra({ index, extra, codes }: { index: number; extra: GuideExtra; codes: string[] }) {
  const c = useController()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className={styles.extra} id={`guide-task-${extra.n}`}>
      <div className={styles.extraHead}>
        <span className={styles.emoji} aria-hidden="true">
          {extra.emoji}
        </span>
        <div>
          <h3>
            <span className="visually-hidden">Задание {extra.n}. </span>
            {extra.title}
          </h3>
          <p>
            <Rich text={extra.text} />
          </p>
        </div>
      </div>
      <ol className={styles.parts}>
        {extra.parts.map((part, j) => {
          const tabTitle = c.variant.tabs[part.tab].title
          const done = isPartDone(part, codes)
          const settings = part.mode === 'settings'
          const action = settings ? `Добавить строку в «${tabTitle}»` : `Вставить в «${tabTitle}»`
          return (
            <li key={j} className={styles.part} data-done={done}>
              <span className={styles.partNode} aria-hidden="true">
                {done ? <CheckIcon size={14} /> : j + 1}
              </span>
              <span className={styles.partMain}>
                <span className={styles.partTitle}>{part.title}</span>
                <span className={styles.partTab}>
                  {done ? 'уже есть в коде' : settings ? 'одна строка в «Движок»' : `вкладка «${tabTitle}»`}
                </span>
              </span>
              <button
                type="button"
                className="key key--s key--icon"
                aria-expanded={open === j}
                aria-label={open === j ? `Скрыть код: ${part.title}` : `Показать код: ${part.title}`}
                title={open === j ? 'Скрыть код' : 'Показать код'}
                onClick={() => setOpen(open === j ? null : j)}
              >
                <CodeIcon size={14} />
              </button>
              <button
                type="button"
                className="key key--apple key--s"
                aria-label={action}
                onClick={() => c.insertPart(index, j)}
              >
                {settings ? 'Добавить строку' : 'Вставить'}
              </button>
              {open === j && (
                <div className={styles.partCode}>
                  <CodeBlock code={settings ? part.line : part.code} />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
})
