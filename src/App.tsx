import { ControllerContext } from '@/app/context.ts'
import type { Controller } from '@/app/controller.ts'
import { Dialogs } from '@/components/Dialogs.tsx'
import { GamePanel } from '@/components/GamePanel.tsx'
import { Header } from '@/components/Header.tsx'
import { PickWindow } from '@/components/PickWindow.tsx'
import { Workspace } from '@/components/Workspace.tsx'
import styles from './App.module.css'

export default function App({ controller }: { controller: Controller }) {
  return (
    <ControllerContext.Provider value={controller}>
      <div className={styles.app}>
        <Header />
        <main className={styles.main}>
          <Workspace />
          <GamePanel />
        </main>
        <Dialogs />
        <PickWindow />
      </div>
    </ControllerContext.Provider>
  )
}
