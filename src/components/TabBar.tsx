import { type KeyboardEvent, useMemo } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { type TabBadge, tabBadges, type View } from '@/app/controller.ts'
import { BadgeIcon, BookIcon, SlidersIcon } from './icons.tsx'
import styles from './TabBar.module.css'

const BADGE_TEXT: Record<TabBadge, string> = {
  engine: 'настройки и главный цикл',
  empty: 'пока только комментарий',
  code: 'есть код',
  done: 'шаг сделан',
  error: 'во вкладке ошибка',
}

export function TabBar() {
  const c = useController()
  const view = useApp((s) => s.view)
  const codes = useApp((s) => s.codes)
  const syntax = useApp((s) => s.syntax)
  const runtimeErrorTab = useApp((s) => s.runtimeErrorTab)
  const badges = useMemo(() => tabBadges(c, { codes, syntax, runtimeErrorTab }), [c, codes, syntax, runtimeErrorTab])

  const views: View[] = [...(c.variant.hasGuide ? (['guide'] as View[]) : []), ...c.variant.tabs.map((_, i) => i)]

  // Стрелки ← → переключают вкладки, как в любом списке вкладок.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const at = views.indexOf(view)
    let next = at
    if (e.key === 'ArrowLeft') next = (at - 1 + views.length) % views.length
    if (e.key === 'ArrowRight') next = (at + 1) % views.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = views.length - 1
    c.selectView(views[next])
    document.getElementById(`tab-${String(views[next])}`)?.focus()
  }

  return (
    <div className={styles.bar} role="tablist" aria-label="Вкладки" onKeyDown={onKeyDown}>
      {c.variant.hasGuide && (
        <button
          type="button"
          role="tab"
          id="tab-guide"
          aria-selected={view === 'guide'}
          tabIndex={view === 'guide' ? 0 : -1}
          className={`key ${styles.tab} ${styles.guide}`}
          onClick={() => c.selectView('guide')}
        >
          <BookIcon size={15} />
          Гайд
        </button>
      )}
      {c.variant.tabs.map((tab, i) => {
        const badge = badges[i]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${i}`}
            aria-selected={view === i}
            tabIndex={view === i ? 0 : -1}
            className={`key ${styles.tab}`}
            data-error={badge === 'error' || undefined}
            onClick={() => c.selectView(i)}
            title={`${tab.title}: ${BADGE_TEXT[badge]}`}
          >
            {tab.step && <span className={styles.num}>{tab.step}</span>}
            {tab.title}
            <span className={styles.badge}>
              {badge === 'engine' ? <SlidersIcon size={13} /> : <BadgeIcon kind={badge} />}
            </span>
            <span className="visually-hidden">, {BADGE_TEXT[badge]}</span>
          </button>
        )
      })}
    </div>
  )
}
