import { useSyncExternalStore } from 'react'

// Маленький внешний стор. Компонент подписывается только на нужный ему кусок
// состояния, поэтому частые обновления (консоль, «Приборы») не перерисовывают всё приложение.

export interface Store<T extends object> {
  get(): T
  set(patch: Partial<T>): void
  subscribe(listener: () => void): () => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(patch) {
      let changed = false
      for (const key in patch) {
        if (!Object.is(state[key], patch[key])) {
          changed = true
          break
        }
      }
      if (!changed) return
      state = { ...state, ...patch }
      for (const l of listeners) l()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** Селектор должен возвращать примитив или уже существующий объект из состояния. */
export function useStore<T extends object, S>(store: Store<T>, select: (s: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()))
}
