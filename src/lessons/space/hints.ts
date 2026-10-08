import { hintSet } from '../commonHints.ts'
import type { Hint } from '../types.ts'

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
    text: 'На сколько пикселей пришельцы спускаются за кадр. 1 — в самый раз, можно дробное: 0.5.',
  },
  {
    name: 'waveSize',
    kind: 'variable',
    text: 'Сколько пришельцев в волне. Они прилетают по одному, так что можно и 10.',
  },
  { name: 'enemyPic', kind: 'variable', text: 'Картинка пришельца. Кнопка «Сменить» — рядом.' },
  {
    name: 'bulletColor',
    kind: 'variable',
    text: 'Цвет пуль, например "#ffd54a" или "cyan". Кнопка «Сменить» — рядом.',
  },
  { name: 'boomPic', kind: 'variable', text: 'Картинка взрыва (дополнительное задание).' },
  { name: 'maxSpeed', kind: 'variable', text: 'Быстрее этой скорости волны не полетят (дополнительное задание).' },
  { name: 'shipPic', kind: 'variable', text: 'Картинка корабля. Объявлена во вкладке «Корабль».' },
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
    text: 'Массив всех пришельцев. У каждого есть x, y и dx — своя скорость вбок. Пустой — летит новая волна.',
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
  { name: 'shownWave', kind: 'variable', text: 'Движок: волна, про которую уже показана надпись «Волна N».' },
  { name: 'banner', kind: 'variable', text: 'Движок: сколько кадров ещё показывать надпись «Волна N».' },
  { name: 'frame', kind: 'variable', text: 'Номер кадра. Движок прибавляет 1 каждый кадр.' },
  { name: 'keys', kind: 'variable', text: 'Какие клавиши зажаты: keys["ArrowLeft"], keys[" "] — это пробел.' },
  { name: 'stars', kind: 'variable', text: 'Звёзды на фоне. Их двигает и рисует движок.' },
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
  {
    name: 'drawBanner',
    kind: 'function',
    detail: '()',
    text: 'Движок: прилетела новая волна — крупно пишет «Волна N», и надпись гаснет.',
  },
]

export const SPACE_HINTS = hintSet({
  globals: GLOBALS,
  arrays: ['bullets', 'enemies', 'booms'],
  watch: ['score', 'lives', 'wave', 'bullets', 'enemies', 'reload'],
})
