import { memo } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { type FnState, partDone, stepStates, varLine } from '@/core/progress.ts'
import type { GuideExtra, GuidePart, GuideStep, GuideTask } from '@/lessons/types.ts'
import { CodeBlock } from './CodeBlock.tsx'
import { CheckIcon, WarnIcon } from './icons.tsx'
import { Rich } from './Rich.tsx'
import styles from './Guide.module.css'

// Гайд заменяет презентацию: ученик идёт в своём темпе. Не размонтируется,
// чтобы помнить прокрутку.
export function Guide() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const { lesson } = c
  const total = lesson.steps.length

  return (
    <article className={styles.guide}>
      <header className={styles.intro}>
        <h1>{lesson.title}</h1>
        {lesson.intro.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </header>

      {lesson.steps.map((step, i) => (
        <StepSection key={step.step} index={i} step={step} total={total} code={codes[step.tab]} />
      ))}

      <section className={styles.section} aria-labelledby="guide-tasks">
        <h2 id="guide-tasks">Задания на улучшение</h2>
        <p className={styles.lead}>Готового кода тут нет — только условие и подсказка. Попробуй сам.</p>
        {lesson.tasks.map((t) => (
          <Task key={t.n} task={t} />
        ))}
      </section>

      <section className={styles.section} aria-labelledby="guide-extras">
        <h2 id="guide-extras">Бомба и звезда</h2>
        <p className={styles.lead}>
          Тут код есть. Каждое задание — из трёх частей, делай их по порядку и запускай после каждой.
        </p>
        {lesson.extras.map((x, i) => (
          <Extra key={x.n} index={i} extra={x} codes={codes} />
        ))}
        <p className={styles.warn}>
          <WarnIcon size={15} className={styles.warnIcon} />
          <span>
            <Rich text={lesson.extrasNote} />
          </span>
        </p>
      </section>

      {lesson.moreTasks.length > 0 && (
        <section className={styles.section} aria-labelledby="guide-more">
          <h2 id="guide-more">Ещё одно задание</h2>
          {lesson.moreTasks.map((t) => (
            <Task key={t.n} task={t} />
          ))}
        </section>
      )}

      <footer className={styles.footer}>
        <p>
          Хочешь посмотреть, какой может получиться игра целиком?{' '}
          <a href="?finished" target="_blank" rel="noreferrer">
            Открой готовую версию
          </a>
          . У неё своё сохранение — твой код она не тронет.
        </p>
      </footer>
    </article>
  )
}

const FN_TEXT: Record<FnState, string> = {
  ok: 'есть, внутри есть код',
  empty: 'есть, но внутри пусто',
  missing: 'функции пока нет',
}

const StepSection = memo(function StepSection({
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
  const tabTitle = c.variant.tabs[step.tab].title
  const states = stepStates(code, step.fns)
  const done = states.every((s) => s.state === 'ok')

  return (
    <section
      id={`guide-step-${step.step}`}
      className={styles.section}
      aria-labelledby={`guide-step-${step.step}-title`}
    >
      <p className={styles.stepNo}>
        Шаг {step.step} из {total}
      </p>
      <div className={styles.titleRow}>
        <h2 id={`guide-step-${step.step}-title`}>{step.title}</h2>
        {done ? (
          <span className="chip chip--ok">
            <CheckIcon size={12} />
            Сделано
          </span>
        ) : (
          <span className="chip chip--todo">Не сделано</span>
        )}
      </div>
      {step.body.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}

      <InsertRow tab={tabTitle} label={`Вставить во вкладку «${tabTitle}»`} onClick={() => c.insertStep(index)} />
      <CodeBlock code={step.code} />
      <p className={styles.aside}>Можно не вставлять, а перепечатать руками — так лучше запомнится.</p>

      <div className={styles.check}>
        <h3>Проверь</h3>
        <ul className={styles.checks}>
          {step.checks.map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
        <p className={styles.fnTitle}>«Сделано» загорится, когда во вкладке «{tabTitle}»:</p>
        <ul className={styles.fns}>
          {states.map((s) => (
            <li key={s.name} data-state={s.state}>
              {s.state === 'ok' ? <CheckIcon size={13} /> : <span className={styles.dot} aria-hidden="true" />}
              <code className="inline-code">{s.name}</code> — {FN_TEXT[s.state]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
})

function InsertRow({ tab, label, onClick }: { tab: string; label: string; onClick: () => void }) {
  return (
    <div className={styles.insert}>
      <span className={styles.tabLabel}>Вкладка «{tab}»</span>
      <button type="button" className="btn btn--outline" onClick={onClick}>
        {label}
      </button>
    </div>
  )
}

function Task({ task }: { task: GuideTask }) {
  return (
    <div className={styles.task}>
      <h3>
        <span className={styles.taskNum}>{task.n}.</span> {task.title}
      </h3>
      {task.body.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
      <details className={styles.hint}>
        <summary>Подсказка</summary>
        {task.hint.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </details>
    </div>
  )
}

function isPartDone(part: GuidePart, codes: string[]) {
  const code = codes[part.tab]
  return part.mode === 'settings' ? varLine(code, part.name) > 0 : partDone(code, part.marks)
}

const Extra = memo(function Extra({ index, extra, codes }: { index: number; extra: GuideExtra; codes: string[] }) {
  const c = useController()
  return (
    <div className={styles.extra} id={`guide-task-${extra.n}`}>
      <h3 className={styles.extraTitle}>
        <span className={styles.taskNum}>{extra.n}.</span> <span aria-hidden="true">{extra.emoji}</span> {extra.title}
      </h3>
      {extra.body.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
      {extra.parts.map((part, j) => {
        const tabTitle = c.variant.tabs[part.tab].title
        const done = isPartDone(part, codes)
        return (
          <div key={j} className={styles.part}>
            <div className={styles.titleRow}>
              <h4>
                Часть {j + 1}. {part.title}
              </h4>
              {done && (
                <span className="chip chip--ok">
                  <CheckIcon size={12} />
                  уже есть в коде
                </span>
              )}
            </div>
            {part.body.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
            <InsertRow
              tab={tabTitle}
              label={part.mode === 'settings' ? `Добавить строку в «${tabTitle}»` : `Вставить во вкладку «${tabTitle}»`}
              onClick={() => c.insertPart(index, j)}
            />
            <CodeBlock code={part.mode === 'settings' ? part.line : part.code} />
          </div>
        )
      })}
    </div>
  )
})
