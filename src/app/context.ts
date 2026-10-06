import { createContext, useContext } from 'react'
import type { AppState, Controller } from './controller.ts'
import { useStore } from './store.ts'

export const ControllerContext = createContext<Controller | null>(null)

export function useController(): Controller {
  const c = useContext(ControllerContext)
  if (!c) throw new Error('Нет ControllerContext')
  return c
}

/** Кусок состояния приложения. Селектор — примитив или объект из состояния как есть. */
export function useApp<S>(select: (s: AppState) => S): S {
  return useStore(useController().store, select)
}
