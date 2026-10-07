import type { Hint, HintSet } from '../types.ts'

// Подсказки к именам движка Космоса: показываются в автодополнении и при наведении мыши.

const GLOBALS: Hint[] = [
  { name: 'shipSpeed', kind: 'variable', text: 'На сколько пикселей корабль пролетает за кадр. 0 — стоит.' },
  { name: 'bulletSpeed', kind: 'variable', text: 'На сколько пикселей пуля пролетает вверх за кадр. 0 — висит.' },
  {
    name: 'reloadTime',
    kind: 'variable',
    text: 'Перезарядка: сколько кадров ждать между выстрелами. 0 — пуля каждый кадр, сплошной луч.',
  },
  {
    name: 'enemySpeed',
    kind: 'variable',
    text: 'На сколько пикселей пришельцы спускаются за кадр. Можно дробное: 0.5.',
  },
  { name: 'waveSize', kind: 'variable', text: 'Сколько пришельцев в волне. Больше 5 в ширину экрана не влезет.' },
  { name: 'enemyEmoji', kind: 'variable', text: 'Смайлик пришельца. Кнопка «Сменить» — рядом.' },
  {
    name: 'bulletColor',
    kind: 'variable',
    text: 'Цвет пуль, например "#ffd54a" или "cyan". Кнопка «Сменить» — рядом.',
  },
  { name: 'boomEmoji', kind: 'variable', text: 'Смайлик взрыва (дополнительное задание).' },
  { name: 'maxSpeed', kind: 'variable', text: 'Быстрее этой скорости волны не полетят (дополнительное задание).' },
  { name: 'shipEmoji', kind: 'variable', text: 'Смайлик корабля. Объявлен во вкладке «Корабль».' },
  { name: 'shipX', kind: 'variable', text: 'Где корабль по горизонтали: от 0 до 340.' },
  { name: 'shipY', kind: 'variable', text: 'Где корабль по вертикали. Не меняется: корабль всегда внизу.' },
  {
    name: 'bullets',
    kind: 'variable',
    text: 'Массив всех пуль. У каждой есть x и y. Пуля пропадает за верхним краем или при попадании.',
  },
  {
    name: 'enemies',
    kind: 'variable',
    text: 'Массив всех пришельцев. У каждого есть x и y. Пустой — летит новая волна.',
  },
  {
    name: 'booms',
    kind: 'variable',
    text: 'Массив взрывов: x, y и t — сколько кадров ещё гореть (дополнительное задание).',
  },
  {
    name: 'reload',
    kind: 'variable',
    text: 'Счётчик перезарядки: сколько кадров ещё ждать до выстрела. 0 — можно стрелять.',
  },
  { name: 'score', kind: 'variable', text: 'Счёт: сколько пришельцев сбито.' },
  { name: 'lives', kind: 'variable', text: 'Жизни. Пришелец долетел до корабля — минус одна. 0 — игра окончена.' },
  { name: 'wave', kind: 'variable', text: 'Номер волны. Растёт на 1, когда прилетает новая.' },
  { name: 'frame', kind: 'variable', text: 'Номер кадра. Движок прибавляет 1 каждый кадр.' },
  { name: 'keys', kind: 'variable', text: 'Какие клавиши зажаты: keys["ArrowLeft"], keys[" "] — это пробел.' },
  { name: 'stars', kind: 'variable', text: 'Звёзды на фоне. Их двигает и рисует движок.' },
  { name: 'ctx', kind: 'variable', text: 'Кисточка для рисования на холсте: ctx.fillText, ctx.fillRect…' },
  { name: 'canvas', kind: 'variable', text: 'Сам холст игры, 380 × 470 пикселей.' },
  { name: 'drawShip', kind: 'function', detail: '()', text: 'Шаг 1: рисует корабль. Движок вызывает её каждый кадр.' },
  { name: 'moveShip', kind: 'function', detail: '()', text: 'Шаг 1: двигает корабль стрелками.' },
  { name: 'shoot', kind: 'function', detail: '()', text: 'Шаг 2: пробел — новая пуля, если перезарядка закончилась.' },
  { name: 'moveBullets', kind: 'function', detail: '()', text: 'Шаг 2: двигает пули вверх и убирает улетевшие.' },
  { name: 'drawBullets', kind: 'function', detail: '()', text: 'Шаг 2: рисует все пули.' },
  {
    name: 'moveEnemies',
    kind: 'function',
    detail: '()',
    text: 'Шаг 3: новая волна, когда пришельцев нет, и спуск вниз.',
  },
  { name: 'drawEnemies', kind: 'function', detail: '()', text: 'Шаг 3: рисует всех пришельцев.' },
  {
    name: 'checkHits',
    kind: 'function',
    detail: '()',
    text: 'Шаг 4: каждая пуля × каждый пришелец — сбит или нет; долетел — минус жизнь.',
  },
  { name: 'drawSpace', kind: 'function', detail: '()', text: 'Движок: рисует звёзды и луну.' },
  { name: 'loop', kind: 'function', detail: '()', text: 'Главный цикл движка. Перерисовывает поле 60 раз в секунду.' },
  {
    name: 'requestAnimationFrame',
    kind: 'function',
    detail: '(f)',
    text: 'Попросить браузер вызвать f в следующем кадре.',
  },
]

const CTX: Hint[] = [
  { name: 'fillText', kind: 'method', detail: '(text, x, y)', text: 'Написать текст или эмодзи в точке x, y.' },
  { name: 'fillRect', kind: 'method', detail: '(x, y, w, h)', text: 'Закрасить прямоугольник шириной w и высотой h.' },
  { name: 'strokeRect', kind: 'method', detail: '(x, y, w, h)', text: 'Нарисовать рамку прямоугольника.' },
  { name: 'fillStyle', kind: 'property', text: 'Цвет заливки, например "#ffd54a" или "yellow".' },
  { name: 'strokeStyle', kind: 'property', text: 'Цвет линий и рамок.' },
  { name: 'font', kind: 'property', text: 'Шрифт для fillText, например "34px serif".' },
  {
    name: 'globalAlpha',
    kind: 'property',
    text: 'Прозрачность всего, что рисуется дальше: 1 — как есть, 0.5 — наполовину.',
  },
  { name: 'save', kind: 'method', detail: '()', text: 'Запомнить кисточку: цвет, шрифт, прозрачность.' },
  { name: 'restore', kind: 'method', detail: '()', text: 'Вернуть кисточку, какой она была при save().' },
]

const MATH: Hint[] = [
  { name: 'random', kind: 'method', detail: '()', text: 'Случайное число от 0 до 1 (1 не бывает).' },
  { name: 'abs', kind: 'method', detail: '(x)', text: 'Число без минуса: Math.abs(-5) — это 5.' },
  { name: 'floor', kind: 'method', detail: '(x)', text: 'Округлить вниз: Math.floor(4.7) — это 4.' },
  { name: 'min', kind: 'method', detail: '(a, b)', text: 'Меньшее из чисел.' },
  { name: 'max', kind: 'method', detail: '(a, b)', text: 'Большее из чисел.' },
]

const CONSOLE: Hint[] = [
  { name: 'log', kind: 'method', detail: '(...)', text: 'Вывести значение в «Консоль» под игрой.' },
  { name: 'warn', kind: 'method', detail: '(...)', text: 'Вывести предупреждение — оно будет жёлтым.' },
]

const ARRAY: Hint[] = [
  { name: 'length', kind: 'property', text: 'Сколько элементов в массиве.' },
  { name: 'push', kind: 'method', detail: '(x)', text: 'Добавить элемент в конец массива.' },
  { name: 'shift', kind: 'method', detail: '()', text: 'Убрать первый элемент массива.' },
  {
    name: 'splice',
    kind: 'method',
    detail: '(i, 1)',
    text: 'Убрать элемент номер i. Все, кто после него, сдвинутся на одно место влево.',
  },
]

export const SPACE_HINTS: HintSet = {
  globals: GLOBALS,
  members: { ctx: CTX, Math: MATH, console: CONSOLE, bullets: ARRAY, enemies: ARRAY, booms: ARRAY },
  watch: ['score', 'lives', 'wave', 'bullets', 'enemies', 'reload'],
}
