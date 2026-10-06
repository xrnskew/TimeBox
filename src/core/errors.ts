// Перевод сообщений об ошибках на понятный язык.

type Rule = [RegExp, (m: RegExpMatchArray) => string]

const CHAR_HINTS: Record<string, string> = {
  '≥': 'символ ≥ JavaScript не понимает — пиши >=',
  '≤': 'символ ≤ JavaScript не понимает — пиши <=',
  '≠': 'символ ≠ JavaScript не понимает — пиши !==',
  '×': 'для умножения нужна звёздочка *',
  '÷': 'для деления нужна косая черта /',
  '−': 'это длинный минус — нужен обычный -',
  '–': 'это тире — нужен обычный минус -',
  '—': 'это тире — нужен обычный минус -',
}
const QUOTES = '«»„“”‘’'

function unexpectedChar(ch: string): string {
  if (CHAR_HINTS[ch]) return CHAR_HINTS[ch]
  if (QUOTES.includes(ch)) return `кавычки ${ch} не подходят — используй обычные "`
  return `символ ${ch} JavaScript не понимает`
}

// Сообщения acorn (проверка до запуска). Оригинал не показываем: он на английском
// и про внутренности парсера.
const SYNTAX_RULES: Rule[] = [
  [/^Unexpected token/, () => 'здесь что-то лишнее или чего-то не хватает'],
  [/^Unterminated string constant/, () => 'не закрыта кавычка'],
  [/^Unterminated template/, () => 'не закрыта обратная кавычка `'],
  [/^Unterminated comment/, () => 'не закрыт комментарий — не хватает */'],
  [/^Unterminated regular expression/, () => 'не закрыто регулярное выражение /…/'],
  [/^Unexpected character '(.+)'/, (m) => unexpectedChar(m[1])],
  [/^Identifier '(.+)' has already been declared/, (m) => `имя ${m[1]} уже объявлено в другой вкладке или выше`],
  [/^Assigning to rvalue/, () => 'слева от = должно стоять имя переменной'],
  [/^'return' outside of function/, () => 'return можно писать только внутри функции'],
  [/^Unexpected keyword '(.+)'/, (m) => `слово ${m[1]} здесь не к месту`],
  [/^The keyword '(.+)' is reserved/, (m) => `${m[1]} — служебное слово, так ничего назвать нельзя`],
  [/^Invalid number/, () => 'число записано неправильно'],
  [/^Identifier directly after number/, () => 'сразу после числа не может идти буква'],
]

export function explainSyntax(raw: string): string {
  const msg = raw.replace(/\s*\(\d+:\d+\)$/, '')
  for (const [re, fn] of SYNTAX_RULES) {
    const m = msg.match(re)
    if (m) return fn(m)
  }
  return msg
}

// Сообщения браузера во время выполнения. Переводим частично,
// оригинал остаётся в скобках.
const RUNTIME_RULES: Rule[] = [
  [/^ReferenceError: (.+) is not defined/, (m) => `${m[1]} не найдено — проверь, нет ли опечатки в имени`],
  [/^TypeError: (.+) is not a function/, (m) => `${m[1]} — не функция, её нельзя вызвать со скобками`],
  [
    /^TypeError: Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+)'\)/,
    (m) => `нельзя взять .${m[2]} у пустого значения ${m[1]}`,
  ],
  [
    /^TypeError: Cannot set propert(?:y|ies) of (undefined|null) \(setting '(.+)'\)/,
    (m) => `нельзя записать .${m[2]} в пустое значение ${m[1]}`,
  ],
  [
    /^TypeError: (undefined|null) is not an object \(evaluating '(.+)'\)/,
    (m) => `нельзя вычислить ${m[2]}: там пустое значение ${m[1]}`,
  ],
  [/^TypeError: (.+) is (undefined|null)$/, (m) => `${m[1]} — пустое значение ${m[2]}, у него ничего нельзя взять`],
  [
    /^SyntaxError: Identifier '(.+)' has already been declared/,
    (m) => `имя ${m[1]} уже объявлено в другой вкладке или выше`,
  ],
  [
    /^SyntaxError: redeclaration of (?:let|const|var) (.+)/,
    (m) => `имя ${m[1]} уже объявлено в другой вкладке или выше`,
  ],
  [/^TypeError: Assignment to constant variable/, () => 'const нельзя менять — объяви переменную через var'],
  [
    /^(?:RangeError: Maximum call stack|InternalError: too much recursion)/,
    () => 'функция вызывает сама себя без конца',
  ],
  [/^SyntaxError: Invalid or unexpected token/, () => 'непонятный символ или незакрытая кавычка'],
  [/^SyntaxError: Unexpected end of input/, () => 'код оборвался — скорее всего, не хватает закрывающей скобки }'],
  [/^SyntaxError: Unexpected token/, () => 'здесь что-то лишнее или чего-то не хватает'],
]

export function explainRuntimeError(raw: string): string {
  const msg = raw.replace(/^Uncaught\s+/, '').trim()
  for (const [re, fn] of RUNTIME_RULES) {
    const m = msg.match(re)
    if (m) return `${fn(m)} (${msg})`
  }
  return msg
}

export function isSyntaxMessage(raw: string): boolean {
  return /^(Uncaught\s+)?SyntaxError\b/.test(raw)
}

export function formatError(place: { title: string; line: number } | null, text: string): string {
  return place ? `Ошибка во вкладке «${place.title}», строка ${place.line}: ${text}` : `Ошибка: ${text}`
}
