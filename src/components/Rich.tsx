import { Fragment } from 'react'

// Текст гайда: `код` — инлайн-код, [[Ctrl+Z]] — клавиша.
const TOKEN = /(`[^`]+`|\[\[[^\]]+\]\])/

export function Rich({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1)
          return (
            <code key={i} className="inline-code">
              {part.slice(1, -1)}
            </code>
          )
        if (part.startsWith('[[') && part.endsWith(']]')) return <kbd key={i}>{part.slice(2, -2)}</kbd>
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
