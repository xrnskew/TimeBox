import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/ui.css'
import { createController } from '@/app/controller.ts'
import { LockScreen } from '@/components/LockScreen.tsx'
import { isFinishedUnlocked } from '@/sandbox/storage.ts'
import { CATCH_LESSON } from '@/lessons/catch/index.ts'
import App from '@/App.tsx'

// ?finished — готовая игра: своё сохранение, гайда нет, открывается только по паролю.
const finished = new URLSearchParams(location.search).has('finished')
const lesson = CATCH_LESSON
document.title = finished ? `${lesson.title} — готовая игра` : `${lesson.title} — песочница`

const root = createRoot(document.getElementById('root')!)

function start() {
  // контроллер сразу запускает игру — создаём его только после пароля
  const controller = createController(lesson, finished ? lesson.finished : lesson.tutorial)
  root.render(
    <StrictMode>
      <App controller={controller} />
    </StrictMode>,
  )
}

if (finished && !isFinishedUnlocked()) {
  root.render(
    <StrictMode>
      <LockScreen onUnlock={start} />
    </StrictMode>,
  )
} else {
  start()
}
