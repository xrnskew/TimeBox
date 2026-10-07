import { useRef, useState } from 'react'
import { gameHref } from '@/app/routes.ts'
import { checkFinishedPassword } from '@/core/lock.ts'
import { rememberFinishedUnlocked } from '@/sandbox/storage.ts'
import { LockIcon, LogoCube } from './icons.tsx'
import styles from './LockScreen.module.css'

/** Экран перед готовой игрой: без пароля она не откроется, даже по прямой ссылке. */
export function LockScreen({ gameId, onUnlock }: { gameId: string; onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  return (
    <main className={styles.screen}>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault()
          if (checkFinishedPassword(password)) {
            rememberFinishedUnlocked()
            onUnlock()
          } else {
            setWrong(true)
            input.current?.select()
          }
        }}
      >
        <span className={styles.badge} aria-hidden="true">
          <LogoCube className={styles.logo} />
          <span className={styles.lock}>
            <LockIcon size={16} />
          </span>
        </span>
        <h1>Готовая игра под паролем</h1>
        <p>Свою игру ты собираешь в учебной версии.</p>
        <label htmlFor="lock-password" className="visually-hidden">
          Пароль
        </label>
        <input
          ref={input}
          id="lock-password"
          className={styles.input}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Пароль"
          autoFocus
          value={password}
          aria-invalid={wrong}
          onChange={(e) => {
            setPassword(e.target.value)
            setWrong(false)
          }}
        />
        {wrong && (
          <p className={styles.error} role="alert">
            Пароль не подошёл. Проверь цифры и попробуй ещё раз.
          </p>
        )}
        <button type="submit" className="key key--apple key--l" disabled={!password.trim()}>
          Открыть
        </button>
        <a className={styles.back} href={gameHref(gameId)}>
          Вернуться к учебной версии
        </a>
      </form>
    </main>
  )
}
