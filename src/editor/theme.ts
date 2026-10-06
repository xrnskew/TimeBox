import { EditorView } from '@codemirror/view'

// Цвета — из CSS-переменных (src/styles/tokens.css), поэтому тема проектора
// переключается без перенастройки редактора.
// { dark: true } обязателен: без него базовая тема CodeMirror светлая, и её стили
// активной строки и выделения перебивают наши.
export const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      color: 'var(--ink)',
      backgroundColor: 'var(--surface)',
      fontSize: 'var(--code-size)',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.6',
      fontVariantLigatures: 'none',
      fontFeatureSettings: '"liga" 0, "calt" 0',
    },
    '.cm-content': { caretColor: 'var(--accent)', padding: '12px 0 48px' },
    '.cm-line': { padding: '0 16px 0 8px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: 'var(--selection)' },
    '.cm-activeLine': { backgroundColor: 'var(--active-line)' },
    '.cm-gutters': {
      backgroundColor: 'var(--surface)',
      color: 'var(--faint)',
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 14px', minWidth: '34px' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--dim)' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'var(--bracket)',
      outline: '1px solid var(--line-strong)',
      color: 'inherit',
    },
    '.cm-nonmatchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid var(--danger)',
    },
    '.cm-errorLine': { backgroundColor: 'var(--danger-line)' },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy var(--danger)',
      textDecorationSkipInk: 'none',
      textUnderlineOffset: '3px',
    },
    '.cm-lintPoint-error:after': { borderBottomColor: 'var(--danger)' },
    '.cm-gutter-lint': { width: '14px' },
    '.cm-lint-marker': { width: '10px', height: '10px' },
    '.cm-tooltip': {
      backgroundColor: 'var(--raised)',
      color: 'var(--ink)',
      border: '1px solid var(--line-strong)',
      borderRadius: '8px',
      fontFamily: 'var(--font-ui)',
      fontSize: '14px',
      boxShadow: 'var(--shadow-pop)',
      overflow: 'hidden',
    },
    '.cm-tooltip-lint': { padding: '0' },
    '.cm-diagnostic': { padding: '6px 10px', borderLeft: 'none' },
    '.cm-diagnostic-error': { borderLeft: '3px solid var(--danger)' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', maxHeight: '14em' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '2px 10px', lineHeight: '1.6' },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'var(--selection-strong)',
      color: 'var(--ink)',
    },
    '.cm-completionDetail': { color: 'var(--dim)', fontStyle: 'normal', marginLeft: '6px' },
    '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--accent)' },
    '.cm-completionInfo': { padding: '6px 10px', maxWidth: '280px', lineHeight: '1.45' },
    '.cm-hint': { padding: '6px 10px', maxWidth: '300px', lineHeight: '1.45' },
    '.cm-hint b': { fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--tok-variable)' },
    '.cm-panels': { backgroundColor: 'var(--panel)', color: 'var(--ink)' },
  },
  { dark: true },
)
