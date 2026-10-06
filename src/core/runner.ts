// Склейка вкладок в документ для iframe и обратная карта строк.
//
// Документ — два скрипта. Первый — обвязка: window.onerror, фокус, клавиши, консоль,
// часы кадров. Он обязан быть отдельным и первым: если onerror стоит в одном скрипте
// с кодом ученика, синтаксическая ошибка не даёт скрипту запуститься вовсе, и об
// ошибке никто не узнает. Второй скрипт — код вкладок внутри try/catch.

export interface RunConfig {
  /** Забрать фокус после загрузки. false — если до запуска нашли синтаксическую ошибку. */
  focus: boolean
  hitboxes: boolean
}

export interface Place {
  tab: number
  line: number
}

export interface Runner {
  /** Сколько строк документа идёт до первой строки кода вкладок. */
  headerLines: number
  buildDoc(codes: string[], config: RunConfig): string
  /** Номер строки документа → вкладка и строка в ней (по коду на момент запуска). */
  locate(globalLine: number, codes: string[]): Place | null
}

const STYLE =
  'html,body{margin:0;height:100%;background:#141414;overflow:hidden}canvas{display:block;width:100%;height:auto}'

function prefix(runtime: string, config: RunConfig): string {
  // Настройки запуска занимают ровно одну строку, чтобы число строк обвязки не менялось.
  const cfg = config.focus
    ? `var __TB_CFG = ${JSON.stringify(config)};`
    : `var __TB_CFG = ${JSON.stringify(config)}; // фокус остаётся в редакторе: в коде ошибка`
  return [
    '<!doctype html>',
    '<html lang="ru"><head><meta charset="utf-8"><title>Игра</title>',
    `<style>${STYLE}</style>`,
    '</head><body>',
    '<canvas id="game" width="380" height="470"></canvas>',
    '<script>',
    cfg,
    runtime.trimEnd(),
    '</script>',
    '<script>',
    'var canvas = document.getElementById("game"), ctx = canvas.getContext("2d");',
    '__TB.setupCanvas(canvas, ctx);',
    'try {',
    '',
  ].join('\n')
}

const SUFFIX = ['', '} catch (e) { __TB.caught(e); }', '</script>', '</body></html>', ''].join('\n')

/** `</script` внутри строки ученика закрыл бы тег раньше времени. `<\/` в JS — то же самое. */
const escapeScriptEnd = (code: string) => code.replace(/<\/(script)/gi, '<\\/$1')

export function createRunner(runtime: string): Runner {
  if (/<\/script/i.test(runtime)) throw new Error('В обвязке не должно быть </script>')
  const sample = prefix(runtime, { focus: true, hitboxes: false })
  // Считается автоматически: при правке обвязки ничего пересчитывать руками не надо.
  const headerLines = sample.split('\n').length - 1

  return {
    headerLines,
    buildDoc(codes, config) {
      return prefix(runtime, config) + codes.map(escapeScriptEnd).join('\n') + SUFFIX
    },
    locate(globalLine, codes) {
      let local = globalLine - headerLines
      if (local < 1) return null
      for (let tab = 0; tab < codes.length; tab++) {
        // Вкладки склеиваются через '\n' — это совпадает с подсчётом split('\n').
        const len = codes[tab].split('\n').length
        if (local <= len) return { tab, line: local }
        local -= len
      }
      return null
    },
  }
}
