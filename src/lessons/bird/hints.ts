import type { Hint, HintSet } from '../types.ts'

// Подсказки к именам движка Птички: показываются в автодополнении и при наведении мыши.

const GLOBALS: Hint[] = [
  {
    name: 'gravity',
    kind: 'variable',
    text: 'Гравитация: сколько прибавляется к скорости падения каждый кадр. 0 — птица висит.',
  },
  {
    name: 'flapPower',
    kind: 'variable',
    text: 'Сила взмаха: с какой скоростью птица подлетает вверх. 0 — не подлетает.',
  },
  { name: 'pipeSpeed', kind: 'variable', text: 'На сколько пикселей труба едет влево за один кадр. 0 — стоит.' },
  { name: 'pipeGap', kind: 'variable', text: 'Высота дырки в трубе, в пикселях. Меньше — труднее.' },
  {
    name: 'pipeEvery',
    kind: 'variable',
    text: 'Раз во сколько кадров появляется новая труба. 60 кадров — одна секунда.',
  },
  { name: 'birdEmoji', kind: 'variable', text: 'Смайлик птицы. Объявлен во вкладке «Птица».' },
  { name: 'coinEmoji', kind: 'variable', text: 'Эмодзи монетки (дополнительное задание).' },
  { name: 'maxSpeed', kind: 'variable', text: 'Быстрее этой скорости трубы не поедут (дополнительное задание).' },
  { name: 'birdX', kind: 'variable', text: 'Где птица по горизонтали. Не меняется: это трубы едут навстречу.' },
  { name: 'birdY', kind: 'variable', text: 'Где птица по вертикали: 30 — у неба, 460 — на земле.' },
  {
    name: 'speedY',
    kind: 'variable',
    text: 'Скорость птицы по вертикали. Плюс — летит вниз, минус — вверх. Каждый кадр прибавляется к birdY.',
  },
  { name: 'pipes', kind: 'variable', text: 'Массив всех труб. У каждой есть x и top — где начинается дырка.' },
  { name: 'score', kind: 'variable', text: 'Счёт: сколько труб пролетела птица.' },
  { name: 'frame', kind: 'variable', text: 'Номер кадра. Растёт на 1 каждый кадр в movePipes.' },
  { name: 'started', kind: 'variable', text: 'Игра началась: true после первого нажатия пробела.' },
  { name: 'gameOver', kind: 'variable', text: 'Игра окончена: true — птица врезалась, всё остановилось.' },
  { name: 'ctx', kind: 'variable', text: 'Кисточка для рисования на холсте: ctx.fillText, ctx.fillRect…' },
  { name: 'canvas', kind: 'variable', text: 'Сам холст игры, 380 × 470 пикселей.' },
  { name: 'drawBird', kind: 'function', detail: '()', text: 'Шаг 1: рисует птицу. Движок вызывает её каждый кадр.' },
  {
    name: 'moveBird',
    kind: 'function',
    detail: '()',
    text: 'Шаг 1: гравитация и полёт. Движок вызывает её каждый кадр.',
  },
  { name: 'flap', kind: 'function', detail: '()', text: 'Шаг 2: взмах. Движок вызывает её по пробелу.' },
  { name: 'movePipes', kind: 'function', detail: '()', text: 'Шаг 3: добавляет новые трубы и двигает их влево.' },
  { name: 'drawPipes', kind: 'function', detail: '()', text: 'Шаг 3: рисует все трубы.' },
  { name: 'checkHit', kind: 'function', detail: '()', text: 'Шаг 4: врезалась ли птица и пролетела ли трубу.' },
  { name: 'press', kind: 'function', detail: '()', text: 'Движок: пробел или клик — старт игры и взмах.' },
  {
    name: 'speedUp',
    kind: 'function',
    detail: '()',
    text: 'Дополнительное задание: каждые 10 секунд трубы едут быстрее.',
  },
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
  { name: 'fillStyle', kind: 'property', text: 'Цвет заливки, например "#5ec639" или "green".' },
  { name: 'strokeStyle', kind: 'property', text: 'Цвет линий и рамок.' },
  { name: 'font', kind: 'property', text: 'Шрифт для fillText, например "34px serif".' },
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
]

export const BIRD_HINTS: HintSet = {
  globals: GLOBALS,
  members: { ctx: CTX, Math: MATH, console: CONSOLE, pipes: ARRAY },
  watch: ['score', 'birdY', 'speedY', 'pipes', 'pipeSpeed', 'gameOver'],
}
