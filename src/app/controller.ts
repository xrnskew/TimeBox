import { explainRuntimeError, formatError, isSyntaxMessage } from '@/core/errors.ts'
import { planSettingInsert } from '@/core/insert.ts'
import { hasContent, stepDone } from '@/core/progress.ts'
import { findSyntaxError, firstSyntaxError, type SyntaxIssue } from '@/core/syntax.ts'
import { createTabEditors, type TabEditors } from '@/editor/createTabEditors.ts'
import type { Lesson, LessonVariant } from '@/lessons/types.ts'
import { runner } from '@/sandbox/harness.ts'
import { loadActive, loadBest, loadCodes, saveActive, saveBest, saveCodes } from '@/sandbox/storage.ts'
import { createStore, type Store } from './store.ts'

export type View = 'guide' | number
/** running — идёт; over — жизни кончились; stopped — упала с ошибкой; blocked — не запустилась. */
export type GameStatus = 'running' | 'over' | 'stopped' | 'blocked'
export type Panel = 'inspector' | 'console'

export interface ShownError {
  text: string
  tab: number | null
  line: number | null
}

export interface Toast {
  id: number
  text: string
  undo?: () => void
  ms: number
}

export type Dialog = null | { kind: 'reset'; tab: number } | { kind: 'resetAll' }

export interface AppState {
  view: View
  /** Снимок кода для интерфейса (значки, гайд). Обновляется с задержкой после печати. */
  codes: string[]
  /** Живая проверка синтаксиса по вкладкам. */
  syntax: (SyntaxIssue | null)[]
  /** Вкладка с ошибкой выполнения из последнего запуска — пока её не поправили. */
  runtimeErrorTab: number | null
  error: ShownError | null
  runId: number
  doc: string
  game: GameStatus
  gameFocused: boolean
  hitboxes: boolean
  best: number
  lastScore: number
  toast: Toast | null
  dialog: Dialog
  panel: Panel
  unreadLogs: number
}

export interface LogEntry {
  id: number
  level: 'log' | 'warn' | 'error'
  text: string
  count: number
}

export type TabBadge = 'engine' | 'empty' | 'code' | 'done' | 'error'

const SNAPSHOT_DELAY = 250
const SAVE_DELAY = 400
const MAX_LOGS = 200

export type Controller = ReturnType<typeof createController>

export function createController(lesson: Lesson, variant: LessonVariant) {
  const tabs = variant.tabs
  const key = variant.storageKey

  let latestCodes = loadCodes(key, tabs.length) ?? [...variant.initial]
  const savedView = loadActive(key, tabs.length)
  const startView: View = variant.hasGuide ? (savedView ?? 'guide') : typeof savedView === 'number' ? savedView : 0

  const syntaxCache = new Map<string, SyntaxIssue | null>()
  const checkSyntax = (code: string) => {
    let issue = syntaxCache.get(code)
    if (issue === undefined) {
      issue = findSyntaxError(code)
      if (syntaxCache.size > 64) syntaxCache.clear()
      syntaxCache.set(code, issue)
    }
    return issue
  }

  const store: Store<AppState> = createStore<AppState>({
    view: startView,
    codes: latestCodes,
    syntax: latestCodes.map(checkSyntax),
    runtimeErrorTab: null,
    error: null,
    runId: 0,
    doc: '',
    game: 'running',
    gameFocused: false,
    hitboxes: false,
    best: loadBest(key),
    lastScore: 0,
    toast: null,
    dialog: null,
    panel: 'inspector',
    unreadLogs: 0,
  })
  const logs = createStore<{ entries: LogEntry[] }>({ entries: [] })
  const inspector = createStore<{ values: Record<string, string> }>({ values: {} })

  let editors: TabEditors | null = null
  let frame: HTMLIFrameElement | null = null
  let runCodes = latestCodes
  let preRunSyntax = false
  let snapshotTimer = 0
  let saveTimer = 0
  let toastId = 0
  let logId = 0

  const codesNow = () => (editors ? editors.getCodes() : latestCodes)
  const title = (tab: number) => tabs[tab].title

  // ===== Сохранение =====
  function saveNow() {
    clearTimeout(saveTimer)
    saveTimer = 0
    latestCodes = codesNow()
    saveCodes(key, latestCodes)
  }

  function snapshot() {
    clearTimeout(snapshotTimer)
    snapshotTimer = 0
    latestCodes = codesNow()
    const prev = store.get()
    const codes = latestCodes.map((c, i) => (c === prev.codes[i] ? prev.codes[i] : c))
    const same = codes.every((c, i) => c === prev.codes[i])
    if (same) return
    store.set({ codes, syntax: codes.map(checkSyntax) })
  }

  function onChange(tab: number, byUser: boolean) {
    if (byUser) {
      dismissToast()
      if (store.get().runtimeErrorTab === tab) store.set({ runtimeErrorTab: null })
    }
    clearTimeout(snapshotTimer)
    snapshotTimer = window.setTimeout(snapshot, SNAPSHOT_DELAY)
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(saveNow, SAVE_DELAY)
  }

  // ===== Уведомления =====
  function toast(text: string, undo?: () => void, ms = 10_000) {
    store.set({ toast: { id: ++toastId, text, undo, ms } })
  }
  function dismissToast() {
    if (store.get().toast) store.set({ toast: null })
  }

  // ===== Вкладки =====
  function selectView(view: View) {
    if (typeof view === 'number') editors?.show(view)
    editors?.setVisible(view !== 'guide')
    if (store.get().view === view) return
    store.set({ view })
    saveActive(key, view)
    saveNow()
  }

  // ===== Запуск =====
  function launch(codes: string[]) {
    runCodes = codes
    editors?.clearErrors()
    dismissToast()
    logs.set({ entries: [] })
    inspector.set({ values: {} })

    const bad = firstSyntaxError(codes)
    preRunSyntax = bad !== null
    let error: ShownError | null = null
    if (bad) {
      const { line, message } = bad.issue
      error = { text: formatError({ title: title(bad.tab), line }, message), tab: bad.tab, line }
      editors?.markError(bad.tab, line)
    }
    const s = store.get()
    store.set({
      doc: runner.buildDoc(codes, { focus: !bad, hitboxes: s.hitboxes }),
      runId: s.runId + 1,
      error,
      runtimeErrorTab: null,
      game: bad ? 'blocked' : 'running',
      gameFocused: false,
      lastScore: 0,
      unreadLogs: 0,
    })
    // Нашли ошибку до запуска — игра не стартует, фокус остаётся в редакторе.
    if (bad) editors?.focus()
  }

  function run() {
    saveNow()
    snapshot()
    launch(latestCodes)
  }

  function onGameError(message: string, line: number) {
    // Пока есть ошибка, найденная до запуска, синтаксические сообщения из iframe игнорируем.
    if (preRunSyntax && isSyntaxMessage(message)) return
    if (store.get().error) return
    const place = line ? runner.locate(line, runCodes) : null
    const text = formatError(place ? { title: title(place.tab), line: place.line } : null, explainRuntimeError(message))
    if (place) editors?.markError(place.tab, place.line)
    store.set({
      error: { text, tab: place?.tab ?? null, line: place?.line ?? null },
      runtimeErrorTab: place?.tab ?? null,
    })
  }

  function showError() {
    const err = store.get().error
    if (!err || err.tab === null) return
    selectView(err.tab)
    if (err.line) editors?.gotoLine(err.line)
  }

  // ===== Игра =====
  function onMessage(e: MessageEvent) {
    // Принимаем сообщения только от текущего iframe.
    if (!frame || e.source !== frame.contentWindow) return
    const d = e.data as { tb?: number; type?: string; [k: string]: unknown }
    if (!d || d.tb !== 1) return
    switch (d.type) {
      case 'err':
        onGameError(String(d.message), Number(d.line) || 0)
        break
      case 'run':
        run()
        break
      case 'focus':
        store.set({ gameFocused: d.on === true })
        break
      case 'stopped':
        if (store.get().game === 'running') store.set({ game: 'stopped' })
        break
      case 'log':
        appendLogs(d.entries as Omit<LogEntry, 'id'>[])
        break
    }
  }

  function appendLogs(entries: Omit<LogEntry, 'id'>[]) {
    if (!Array.isArray(entries) || !entries.length) return
    let list = logs.get().entries.slice()
    for (const e of entries) {
      const last = list[list.length - 1]
      if (last && last.text === e.text && last.level === e.level)
        list[list.length - 1] = { ...last, count: last.count + e.count }
      else list.push({ id: ++logId, level: e.level, text: String(e.text), count: e.count })
    }
    if (list.length > MAX_LOGS) list = list.slice(-MAX_LOGS)
    logs.set({ entries: list })
    const s = store.get()
    if (s.panel !== 'console') store.set({ unreadLogs: Math.min(99, s.unreadLogs + entries.length) })
  }

  function sendCtl(msg: Record<string, unknown>) {
    try {
      frame?.contentWindow?.postMessage({ tbc: 1, ...msg }, '*')
    } catch {
      // iframe ещё не готов
    }
  }

  function focusGame() {
    try {
      frame?.contentWindow?.focus()
    } catch {
      // ничего
    }
  }

  function formatValue(v: unknown): string {
    if (v === undefined) return '—'
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1)
    if (typeof v === 'string') return JSON.stringify(v)
    if (Array.isArray(v)) return `${v.length} шт.`
    if (typeof v === 'object' && v !== null) return '{…}'
    return String(v)
  }

  // «Приборы», «Игра окончена» и рекорд: 5 раз в секунду, только пока вкладка видна.
  function poll() {
    if (document.hidden || !frame) return
    let w: Record<string, unknown> | null = null
    try {
      w = frame.contentWindow as unknown as Record<string, unknown>
    } catch {
      return
    }
    if (!w) return
    const values: Record<string, string> = {}
    let changed = false
    const prev = inspector.get().values
    for (const name of lesson.hints.watch) {
      values[name] = formatValue(w[name])
      if (values[name] !== prev[name]) changed = true
    }
    if (changed) inspector.set({ values })

    const s = store.get()
    const score = w.score
    const lives = w.lives
    if (typeof score !== 'number') return
    if (score > s.best) {
      store.set({ best: score })
      saveBest(key, score)
    }
    if (s.game === 'running' && typeof lives === 'number' && lives <= 0) store.set({ game: 'over', lastScore: score })
  }

  // ===== Гайд =====
  function replaceTab(tab: number, code: string, done: string) {
    if (!editors) return
    selectView(tab)
    if (editors.getCode(tab) === code) {
      toast(`Этот код уже во вкладке «${title(tab)}». Нажми «Запустить».`)
      return
    }
    editors.replace(tab, code)
    const ed = editors
    toast(`${done} Теперь нажми «Запустить».`, () => ed.undo(tab))
  }

  function insertStep(index: number) {
    const step = lesson.steps[index]
    replaceTab(step.tab, step.code, `Код шага ${step.step} — во вкладке «${title(step.tab)}».`)
  }

  function insertPart(extraIndex: number, partIndex: number) {
    const part = lesson.extras[extraIndex].parts[partIndex]
    if (!editors) return
    if (part.mode === 'replace') {
      replaceTab(part.tab, part.code, `«${part.title}» — во вкладке «${title(part.tab)}».`)
      return
    }
    // В «Движок» никогда не вставляем целиком — только одну строку.
    const plan = planSettingInsert(editors.getCode(part.tab), part.name, part.line)
    selectView(part.tab)
    if (plan.kind === 'exists') {
      editors.gotoLine(plan.line)
      toast(`${part.name} уже есть в «${title(part.tab)}», строка ${plan.line}. Ничего не добавил.`)
      return
    }
    const line = editors.insertLine(part.tab, plan.after, plan.text)
    editors.gotoLine(line)
    const ed = editors
    toast(`Добавил в «${title(part.tab)}» строку ${line} с ${part.name}. Остальные настройки на месте.`, () =>
      ed.undo(part.tab),
    )
  }

  // ===== Сбросы =====
  function replaceAll(codes: string[]): number[] {
    if (!editors) return []
    const ed = editors
    // Только изменённые вкладки: замена неизменённой испортила бы отмену на ней.
    const changed = codes.map((_, i) => i).filter((i) => ed.getCode(i) !== codes[i])
    for (const i of changed) ed.replace(i, codes[i])
    return changed
  }

  function undoAll(changed: number[]) {
    for (const i of changed) editors?.undo(i)
  }

  function confirmReset(tab: number) {
    if (!editors) return
    const code = variant.initial[tab]
    if (editors.getCode(tab) === code) {
      toast(`«${title(tab)}» и так в исходном виде.`)
      return
    }
    editors.replace(tab, code)
    const ed = editors
    toast(tab === 0 ? '«Движок» сброшен.' : `Вкладка «${title(tab)}» сброшена.`, () => ed.undo(tab))
  }

  function confirmResetAll() {
    const changed = replaceAll(variant.initial)
    if (variant.hasGuide) selectView('guide')
    run()
    if (changed.length) toast('Весь код вернулся к началу.', () => undoAll(changed), 30_000)
    else toast('Код и так в исходном виде.')
  }

  // ===== Запуск приложения =====
  window.addEventListener('message', onMessage)
  window.addEventListener('pagehide', saveNow)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveNow()
  })
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.defaultPrevented && !store.get().dialog) {
      e.preventDefault()
      run()
    }
  })
  window.setInterval(poll, 200)

  launch(latestCodes)

  return {
    lesson,
    variant,
    store,
    logs,
    inspector,

    mountEditor(parent: HTMLElement) {
      const view = store.get().view
      editors = createTabEditors({
        parent,
        docs: latestCodes,
        active: typeof view === 'number' ? view : 0,
        hints: lesson.hints,
        lint: checkSyntax,
        onChange,
        onRun: run,
      })
      editors.setVisible(view !== 'guide')
      const err = store.get().error
      if (err && err.tab !== null && err.line) editors.markError(err.tab, err.line)
      return () => {
        latestCodes = codesNow()
        editors?.destroy()
        editors = null
      }
    },

    selectView,
    run,
    showError,
    focusEditor: () => editors?.focus(),

    setFrame(el: HTMLIFrameElement | null) {
      frame = el
    },
    onFrameLoad() {
      if (!preRunSyntax) focusGame()
    },
    focusGame,
    toggleHitboxes() {
      const hitboxes = !store.get().hitboxes
      store.set({ hitboxes })
      sendCtl({ type: 'ctl', hitboxes })
    },
    pressKey(k: string, down: boolean) {
      sendCtl({ type: 'key', key: k, down })
    },
    setPanel(panel: Panel) {
      store.set(panel === 'console' ? { panel, unreadLogs: 0 } : { panel })
    },
    clearLogs() {
      logs.set({ entries: [] })
    },

    insertStep,
    insertPart,

    toast,
    dismissToast,
    openDialog(dialog: Dialog) {
      store.set({ dialog })
    },
    closeDialog() {
      store.set({ dialog: null })
    },
    /** После закрытия окна фокус — в редактор, иначе Ctrl+Z сразу после сброса не сработает. */
    afterDialog() {
      if (typeof store.get().view === 'number') editors?.focus()
    },
    confirmReset,
    confirmResetAll,
  }
}

// ===== Производные значения для интерфейса =====

export function tabBadges(c: Controller, s: Pick<AppState, 'codes' | 'syntax' | 'runtimeErrorTab'>): TabBadge[] {
  const steps = c.variant.hasGuide ? c.lesson.steps : []
  return c.variant.tabs.map((_, i) => {
    if (s.syntax[i] || s.runtimeErrorTab === i) return 'error'
    if (i === 0) return 'engine'
    const step = steps.find((st) => st.tab === i)
    if (step && stepDone(s.codes[i], step.fns)) return 'done'
    return hasContent(s.codes[i]) ? 'code' : 'empty'
  })
}

export function stepsDone(c: Controller, codes: string[]): boolean[] {
  return c.lesson.steps.map((st) => stepDone(codes[st.tab], st.fns))
}
