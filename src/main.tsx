import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/ui.css'
import { createController } from '@/app/controller.ts'
import { CATCH_LESSON } from '@/lessons/catch/index.ts'
import App from '@/App.tsx'

// ?finished — готовая игра: своё сохранение, гайда нет.
const finished = new URLSearchParams(location.search).has('finished')
const lesson = CATCH_LESSON
const controller = createController(lesson, finished ? lesson.finished : lesson.tutorial)
document.title = finished ? `${lesson.title} — готовая игра` : `${lesson.title} — песочница`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App controller={controller} />
  </StrictMode>,
)
