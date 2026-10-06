import { javascriptLanguage } from '@codemirror/lang-javascript'
import { classHighlighter, highlightCode } from '@lezer/highlight'
import { memo } from 'react'
import styles from './CodeBlock.module.css'

interface Segment {
  text: string
  cls: string
}

// Тот же парсер и те же классы tok-*, что в редакторе, — цвета совпадают.
function highlight(code: string): Segment[][] {
  const lines: Segment[][] = [[]]
  highlightCode(
    code,
    javascriptLanguage.parser.parse(code),
    classHighlighter,
    (text, cls) => lines[lines.length - 1].push({ text, cls }),
    () => lines.push([]),
  )
  return lines
}

export const CodeBlock = memo(function CodeBlock({ code }: { code: string }) {
  const lines = highlight(code)
  return (
    <pre className={styles.block}>
      <code>
        {lines.map((segs, i) => (
          <span key={i} className={styles.line}>
            <span className={styles.num} aria-hidden="true">
              {i + 1}
            </span>
            <span>
              {segs.map((s, j) =>
                s.cls ? (
                  <span key={j} className={s.cls}>
                    {s.text}
                  </span>
                ) : (
                  s.text
                ),
              )}
              {'\n'}
            </span>
          </span>
        ))}
      </code>
    </pre>
  )
})
