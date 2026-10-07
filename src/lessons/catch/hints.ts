import { hintSet } from '../commonHints.ts'
import type { Hint } from '../types.ts'

// Подсказки к именам движка: показываются в автодополнении и при наведении мыши.

const GLOBALS: Hint[] = [
  {
    name: 'playerSpeed',
    kind: 'variable',
    text: 'На сколько пикселей сдвигается герой за один кадр. 0 — стоит на месте.',
  },
  {
    name: 'fallSpeed',
    kind: 'variable',
    text: 'На сколько пикселей опускается яблоко за один кадр. 0 — висит на месте.',
  },
  {
    name: 'spawnEvery',
    kind: 'variable',
    text: 'Раз во сколько кадров появляется новое яблоко. 60 кадров — одна секунда.',
  },
  { name: 'playerEmoji', kind: 'variable', text: 'Смайлик героя. Объявлен во вкладке «Герой».' },
  { name: 'itemEmoji', kind: 'variable', text: 'Эмодзи яблока.' },
  { name: 'bombEmoji', kind: 'variable', text: 'Эмодзи бомбы (задание 4).' },
  { name: 'goldEmoji', kind: 'variable', text: 'Эмодзи звезды (задание 5).' },
  { name: 'playerX', kind: 'variable', text: 'Где герой по горизонтали: 0 — левый край, 340 — правый.' },
  { name: 'playerY', kind: 'variable', text: 'Где герой по вертикали. 440 — почти у нижнего края.' },
  { name: 'items', kind: 'variable', text: 'Массив всех падающих предметов. У каждого есть x и y.' },
  { name: 'score', kind: 'variable', text: 'Счёт: сколько очков набрано.' },
  { name: 'lives', kind: 'variable', text: 'Сколько жизней осталось. Когда 0 — игра окончена.' },
  { name: 'frame', kind: 'variable', text: 'Номер кадра. Растёт на 1 каждый кадр в moveItems.' },
  { name: 'keys', kind: 'variable', text: 'Какие клавиши зажаты. keys["ArrowLeft"] — true, пока зажата ←.' },
  {
    name: 'movePlayer',
    kind: 'function',
    detail: '()',
    text: 'Шаг 1: двигает героя. Движок вызывает её каждый кадр.',
  },
  {
    name: 'drawPlayer',
    kind: 'function',
    detail: '()',
    text: 'Шаг 1: рисует героя. Движок вызывает её каждый кадр.',
  },
  { name: 'moveItems', kind: 'function', detail: '()', text: 'Шаг 2: добавляет новые яблоки и опускает их вниз.' },
  { name: 'drawItems', kind: 'function', detail: '()', text: 'Шаг 2: рисует все яблоки.' },
  { name: 'checkCatch', kind: 'function', detail: '()', text: 'Шаг 3: проверяет, поймано яблоко или упало.' },
  {
    name: 'makeItem',
    kind: 'function',
    detail: '()',
    text: 'Бомба и звезда: создаёт новый предмет — яблоко, бомбу или звезду.',
  },
  {
    name: 'speedUp',
    kind: 'function',
    detail: '()',
    text: 'Задание шага 2: каждые 15 секунд игра становится быстрее.',
  },
]

export const CATCH_HINTS = hintSet({
  globals: GLOBALS,
  arrays: ['items'],
  watch: ['score', 'lives', 'playerX', 'items', 'fallSpeed', 'frame'],
})
