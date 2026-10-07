import { hintSet } from '../commonHints.ts'
import type { Hint } from '../types.ts'

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
  { name: 'pipeColor', kind: 'variable', text: 'Цвет труб, например "#5ec639" или "red". Кнопка «Сменить» — рядом.' },
  { name: 'birdEmoji', kind: 'variable', text: 'Смайлик птицы. Объявлен во вкладке «Птица».' },
  { name: 'coinEmoji', kind: 'variable', text: 'Эмодзи монетки (дополнительное задание).' },
  { name: 'maxSpeed', kind: 'variable', text: 'Быстрее этой скорости трубы не поедут (дополнительное задание).' },
  { name: 'birdX', kind: 'variable', text: 'Где птица по горизонтали. Не меняется: это трубы едут навстречу.' },
  { name: 'birdY', kind: 'variable', text: 'Где птица по вертикали: 30 — у неба, 460 — у самого низа: ниже — удар.' },
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
  {
    name: 'drawPipe',
    kind: 'function',
    detail: '(x, from, to)',
    text: 'Движок: рисует трубу цветом pipeColor от y = from до y = to — с шапкой, бликом и тенью.',
  },
  { name: 'press', kind: 'function', detail: '()', text: 'Движок: пробел или клик — старт игры и взмах.' },
  {
    name: 'speedUp',
    kind: 'function',
    detail: '()',
    text: 'Дополнительное задание: каждые 10 секунд трубы едут быстрее.',
  },
]

export const BIRD_HINTS = hintSet({
  globals: GLOBALS,
  arrays: ['pipes'],
  watch: ['score', 'birdY', 'speedY', 'pipes', 'pipeSpeed', 'gameOver'],
})
