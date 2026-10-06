import type { Hint, HintSet } from '../types.ts'

// Подсказки к именам движка: показываются в автодополнении и при наведении мыши.

const GLOBALS: Hint[] = [
  { name: 'playerSpeed', kind: 'variable', text: 'На сколько пикселей сдвигается корзина за один кадр.' },
  { name: 'fallSpeed', kind: 'variable', text: 'На сколько пикселей опускается яблоко за один кадр.' },
  {
    name: 'spawnEvery',
    kind: 'variable',
    text: 'Раз во сколько кадров появляется новое яблоко. 60 кадров — одна секунда.',
  },
  { name: 'playerEmoji', kind: 'variable', text: 'Эмодзи корзины.' },
  { name: 'itemEmoji', kind: 'variable', text: 'Эмодзи яблока.' },
  { name: 'bombEmoji', kind: 'variable', text: 'Эмодзи бомбы (задание 4).' },
  { name: 'goldEmoji', kind: 'variable', text: 'Эмодзи звезды (задание 5).' },
  { name: 'playerX', kind: 'variable', text: 'Где корзина по горизонтали: 0 — левый край, 340 — правый.' },
  { name: 'playerY', kind: 'variable', text: 'Где корзина по вертикали. 440 — почти у нижнего края.' },
  { name: 'items', kind: 'variable', text: 'Массив всех падающих предметов. У каждого есть x и y.' },
  { name: 'score', kind: 'variable', text: 'Счёт: сколько очков набрано.' },
  { name: 'lives', kind: 'variable', text: 'Сколько жизней осталось. Когда 0 — игра окончена.' },
  { name: 'frame', kind: 'variable', text: 'Номер кадра. Растёт на 1 каждый кадр в moveItems.' },
  { name: 'keys', kind: 'variable', text: 'Какие клавиши зажаты. keys["ArrowLeft"] — true, пока зажата ←.' },
  { name: 'ctx', kind: 'variable', text: 'Кисточка для рисования на холсте: ctx.fillText, ctx.fillRect…' },
  { name: 'canvas', kind: 'variable', text: 'Сам холст игры, 380 × 470 пикселей.' },
  {
    name: 'movePlayer',
    kind: 'function',
    detail: '()',
    text: 'Шаг 1: двигает корзину. Движок вызывает её каждый кадр.',
  },
  {
    name: 'drawPlayer',
    kind: 'function',
    detail: '()',
    text: 'Шаг 1: рисует корзину. Движок вызывает её каждый кадр.',
  },
  { name: 'moveItems', kind: 'function', detail: '()', text: 'Шаг 2: добавляет новые яблоки и опускает их вниз.' },
  { name: 'drawItems', kind: 'function', detail: '()', text: 'Шаг 2: рисует все яблоки.' },
  { name: 'checkCatch', kind: 'function', detail: '()', text: 'Шаг 3: проверяет, поймано яблоко или упало.' },
  {
    name: 'makeItem',
    kind: 'function',
    detail: '()',
    text: 'Задания 4–5: создаёт новый предмет — яблоко, бомбу или звезду.',
  },
  { name: 'loop', kind: 'function', detail: '()', text: 'Главный цикл движка. Перерисовывает поле 60 раз в секунду.' },
  {
    name: 'playSound',
    kind: 'function',
    detail: '(name)',
    text: 'Проиграть звук: "catch", "miss", "bomb", "star" или "over".',
  },
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
  { name: 'fillStyle', kind: 'property', text: 'Цвет заливки, например "#ffffff" или "red".' },
  { name: 'strokeStyle', kind: 'property', text: 'Цвет линий и рамок.' },
  { name: 'font', kind: 'property', text: 'Шрифт для fillText, например "34px serif".' },
  { name: 'beginPath', kind: 'method', detail: '()', text: 'Начать новую фигуру.' },
  { name: 'arc', kind: 'method', detail: '(x, y, r, 0, 2 * Math.PI)', text: 'Круг с центром x, y и радиусом r.' },
  { name: 'fill', kind: 'method', detail: '()', text: 'Залить фигуру цветом fillStyle.' },
]

const MATH: Hint[] = [
  { name: 'random', kind: 'method', detail: '()', text: 'Случайное число от 0 до 1 (1 не бывает).' },
  { name: 'abs', kind: 'method', detail: '(x)', text: 'Число без минуса: Math.abs(-5) — это 5.' },
  { name: 'floor', kind: 'method', detail: '(x)', text: 'Округлить вниз: Math.floor(4.7) — это 4.' },
  { name: 'round', kind: 'method', detail: '(x)', text: 'Округлить до ближайшего целого.' },
  { name: 'min', kind: 'method', detail: '(a, b)', text: 'Меньшее из чисел.' },
  { name: 'max', kind: 'method', detail: '(a, b)', text: 'Большее из чисел.' },
  { name: 'PI', kind: 'constant', text: 'Число пи, 3.14159…' },
]

const CONSOLE: Hint[] = [
  { name: 'log', kind: 'method', detail: '(...)', text: 'Вывести значение в «Консоль» под игрой.' },
  { name: 'warn', kind: 'method', detail: '(...)', text: 'Вывести предупреждение — оно будет жёлтым.' },
]

const ARRAY: Hint[] = [
  { name: 'length', kind: 'property', text: 'Сколько элементов в массиве.' },
  { name: 'push', kind: 'method', detail: '(x)', text: 'Добавить элемент в конец массива.' },
  { name: 'splice', kind: 'method', detail: '(i, 1)', text: 'Вырезать один элемент с номером i.' },
]

export const CATCH_HINTS: HintSet = {
  globals: GLOBALS,
  members: { ctx: CTX, Math: MATH, console: CONSOLE, items: ARRAY },
  watch: ['score', 'lives', 'playerX', 'items', 'fallSpeed', 'frame'],
}
