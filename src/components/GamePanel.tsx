import { type MouseEvent, type PointerEvent, useEffect, useRef } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { useStore } from '@/app/store.ts'
import { BoxesIcon, PauseIcon, PlayIcon, StepIcon } from './icons.tsx'
import styles from './GamePanel.module.css'

export function GamePanel() {
  const c = useController()
  const shared = useApp((s) => s.shared)

  return (
    <section className={styles.panel} aria-label="Игра">
      {shared && <SharedBanner />}
      <GameFrame />
      <Controls />
      <FocusHint />
      <TouchKeys />
      <Tools />
      {c.variant.features && (
        <div className={styles.features}>
          <h2>Что тут есть</h2>
          <ul>
            {c.variant.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Каждый запуск — новый iframe целиком: старые обработчики и циклы кадров не копятся. */
function GameFrame() {
  const c = useController()
  const runId = useApp((s) => s.runId)
  const doc = useApp((s) => s.doc)
  const focused = useApp((s) => s.gameFocused)
  const game = useApp((s) => s.game)
  const paused = useApp((s) => s.paused)
  const { setFrame, onFrameLoad } = c

  return (
    <div className={styles.frame} data-focused={focused} data-game={game}>
      <iframe
        key={runId}
        ref={setFrame}
        srcDoc={doc}
        title="Игра «Лови яблоки»"
        className={styles.iframe}
        onLoad={onFrameLoad}
      />
      {game === 'running' && !focused && !paused && (
        <button type="button" className={styles.clickToPlay} onClick={c.focusGame}>
          <span>Кликни, чтобы играть</span>
        </button>
      )}
      {paused && game === 'running' && <span className={styles.pausedChip}>Пауза</span>}
      {game === 'over' && <GameOver />}
      {game === 'blocked' && (
        <div className={styles.card}>
          <strong>Игра не запустилась</strong>
          <p>В коде ошибка. Исправь её и нажми «Запустить».</p>
          <button type="button" className="btn btn--outline btn--small" onClick={c.showError}>
            Показать ошибку
          </button>
        </div>
      )}
      {game === 'stopped' && (
        <div className={styles.bottomCard}>
          <p>Игра остановилась из-за ошибки.</p>
          <button type="button" className="btn btn--outline btn--small" onClick={c.showError}>
            Показать
          </button>
        </div>
      )}
    </div>
  )
}

function GameOver() {
  const c = useController()
  const score = useApp((s) => s.lastScore)
  const best = useApp((s) => s.best)
  const ref = useRef<HTMLButtonElement>(null)
  // Enter сразу после проигрыша — «Сыграть ещё».
  useEffect(() => ref.current?.focus(), [])
  return (
    <div className={styles.bottomCard}>
      <p>
        Счёт: <b>{score}</b>. Рекорд: <b>{best}</b>.
      </p>
      <button ref={ref} type="button" className="btn btn--primary btn--small" onClick={c.run}>
        Сыграть ещё
      </button>
    </div>
  )
}

function Controls() {
  const c = useController()
  const paused = useApp((s) => s.paused)
  const speed = useApp((s) => s.speed)
  const hitboxes = useApp((s) => s.hitboxes)
  const game = useApp((s) => s.game)
  const off = game === 'blocked'

  return (
    <div className={styles.controls} role="toolbar" aria-label="Управление игрой">
      <button type="button" className="btn btn--outline btn--small" onClick={c.togglePause} disabled={off}>
        {paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
        {paused ? 'Дальше' : 'Пауза'}
      </button>
      <button
        type="button"
        className="btn btn--outline btn--small"
        onClick={c.stepFrame}
        disabled={off}
        title="Один кадр — и снова пауза"
      >
        <StepIcon size={12} />
        Кадр
      </button>
      <button
        type="button"
        className="btn btn--outline btn--small"
        aria-pressed={speed !== 1}
        onClick={c.toggleSpeed}
        disabled={off}
        title="Игра идёт в два раза медленнее"
      >
        Замедлить
      </button>
      <button
        type="button"
        className="btn btn--outline btn--small"
        aria-pressed={hitboxes}
        onClick={c.toggleHitboxes}
        disabled={off}
        title="Показать зону поимки и точки, которые проверяет checkCatch"
      >
        <BoxesIcon size={12} />
        Границы
      </button>
    </div>
  )
}

function FocusHint() {
  const focused = useApp((s) => s.gameFocused)
  return (
    <p className={styles.hint} aria-live="polite">
      {focused ? 'Двигай корзину' : 'Кликни по игре, потом двигай'} <kbd>←</kbd> <kbd>→</kbd>
    </p>
  )
}

/** Экранные стрелки для планшетов: видны только на сенсорных экранах. */
function TouchKeys() {
  const c = useController()
  const key = (k: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // без захвата тоже работает
      }
      c.pressKey(k, true)
    },
    onPointerUp: () => c.pressKey(k, false),
    onPointerCancel: () => c.pressKey(k, false),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  })
  return (
    <div className={styles.touch}>
      <button type="button" className={styles.touchKey} aria-label="Влево" {...key('ArrowLeft')}>
        ←
      </button>
      <button type="button" className={styles.touchKey} aria-label="Вправо" {...key('ArrowRight')}>
        →
      </button>
    </div>
  )
}

function Tools() {
  const c = useController()
  const panel = useApp((s) => s.panel)
  const unread = useApp((s) => s.unreadLogs)
  return (
    <div className={styles.tools}>
      <div className={styles.toolTabs} role="tablist" aria-label="Инструменты">
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'inspector'}
          aria-controls="tool-panel"
          onClick={() => c.setPanel('inspector')}
        >
          Приборы
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={panel === 'console'}
          aria-controls="tool-panel"
          onClick={() => c.setPanel('console')}
        >
          Консоль
          {unread > 0 && <span className={styles.unread}>{unread}</span>}
        </button>
      </div>
      <div id="tool-panel" role="tabpanel" className={styles.toolBody}>
        {panel === 'inspector' ? <Inspector /> : <Console />}
      </div>
    </div>
  )
}

function Inspector() {
  const c = useController()
  const values = useStore(c.inspector, (s) => s.values)
  const hints = new Map(c.lesson.hints.globals.map((h) => [h.name, h.text]))
  return (
    <dl className={styles.inspector}>
      {c.lesson.hints.watch.map((name) => (
        <div key={name} title={hints.get(name)}>
          <dt>{name}</dt>
          <dd>{values[name] ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function Console() {
  const c = useController()
  const entries = useStore(c.logs, (s) => s.entries)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  if (!entries.length)
    return (
      <p className={styles.empty}>
        Сюда попадёт всё, что ты выведешь через <code className="inline-code">console.log(...)</code>. Например,{' '}
        <code className="inline-code">console.log(playerX)</code> в <code className="inline-code">movePlayer</code>.
      </p>
    )
  return (
    <>
      <ol ref={list} className={styles.console}>
        {entries.map((e) => (
          <li key={e.id} data-level={e.level}>
            <span>{e.text}</span>
            {e.count > 1 && <span className={styles.count}>×{e.count}</span>}
          </li>
        ))}
      </ol>
      <button type="button" className={`btn btn--ghost btn--small ${styles.clear}`} onClick={c.clearLogs}>
        Очистить
      </button>
    </>
  )
}

function SharedBanner() {
  const c = useController()
  return (
    <div className={styles.shared} role="status">
      <p>Это игра по ссылке. Твой код не тронут.</p>
      <div>
        <button type="button" className="btn btn--primary btn--small" onClick={c.acceptShared}>
          Взять код себе
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={c.exitShared}>
          Вернуться к своему
        </button>
      </div>
    </div>
  )
}
