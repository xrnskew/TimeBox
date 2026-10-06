import type { GuideExtra, GuideIntro, GuideStep, GuideTask, Rich } from '../types.ts'
import {
  BOMB_APPLES,
  BOMB_CATCH,
  BOMB_LINE,
  GOLD_APPLES,
  GOLD_CATCH,
  GOLD_LINE,
  STEP_APPLES,
  STEP_CATCH,
  STEP_HERO,
} from './tabs.ts'

// Тон: для подростка, который программирует впервые. Коротко, на «ты».
// Подробности спрятаны за кнопкой «Как это работает».
// В тексте `код` — инлайн-код, [[Ctrl]] — клавиша.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Собери игру за три шага',
  lead: 'Вставь код шага, нажми «Запустить» — и лови яблоки на приставке.',
  tips: ['[[Ctrl]] + [[Enter]] — запустить', '[[Ctrl]] + [[Z]] — отменить правку', 'Клик по экрану, потом [[←]] [[→]]'],
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    tab: 1,
    title: 'Корзина едет',
    lead: 'Корзина ездит стрелками и не уезжает за край.',
    how: [
      'Движок 60 раз в секунду вызывает `movePlayer()` и `drawPlayer()`.',
      'Зажата `ArrowLeft` — уменьшаем `playerX`, `ArrowRight` — увеличиваем.',
      '`ctx.fillText` рисует 🧺 в точке `playerX`, `playerY`. Да, корзина — это просто буква на холсте.',
    ],
    code: STEP_HERO,
    checks: ['Корзина ездит от [[←]] и [[→]]', 'И не уезжает за край'],
    fns: ['movePlayer', 'drawPlayer'],
  },
  {
    step: 2,
    tab: 2,
    title: 'Яблоки падают',
    lead: 'Раз в секунду сверху появляется яблоко и летит вниз.',
    how: [
      'Яблоки лежат в массиве `items`, у каждого есть `x` и `y`.',
      'Раз в `spawnEvery` кадров появляется новое, а цикл `for` прибавляет каждому `fallSpeed`.',
      'Сквозь корзину они пока пролетают — поимка будет в шаге 3.',
    ],
    code: STEP_APPLES,
    checks: ['Яблоки падают', 'В «Приборах» растёт `items`'],
    fns: ['moveItems', 'drawItems'],
  },
  {
    step: 3,
    tab: 3,
    title: 'Поймал или уронил',
    lead: 'Поймал — очко, уронил — минус жизнь.',
    how: [
      'Яблоко рядом с корзиной и опустилось до неё — поймано: `score` + 1.',
      'Улетело ниже поля (`y > 500`) — минус жизнь.',
      'Цикл идёт с конца: `items.splice` вырезает яблоко и сдвигает остальные.',
    ],
    code: STEP_CATCH,
    checks: ['Поймал — счёт растёт', 'Три промаха — «Игра окончена»'],
    fns: ['checkCatch'],
  },
]

export const GUIDE_TASKS: GuideTask[] = [
  {
    n: 1,
    title: 'Своя игра',
    text: 'Поменяй эмодзи и скорости: пусть кот 🐱 ловит рыбок 🐟.',
    hint: ['Всё в начале «Движка»: `playerEmoji`, `itemEmoji`, `playerSpeed`, `fallSpeed`, `spawnEvery`.'],
  },
  {
    n: 2,
    title: 'Десять очков',
    text: 'Пусть каждое яблоко даёт 10 очков.',
    hint: ['Найди в «Поимке» строку, где растёт `score`.'],
  },
  {
    n: 3,
    title: 'Всё быстрее',
    text: 'Каждые 15 секунд — быстрее, но не быстрее 8.',
    hint: ['15 секунд — это 900 кадров: `frame % 900 === 0`.', 'Условие `fallSpeed < 8` не даст разогнаться выше.'],
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 4,
    emoji: '💣',
    title: 'Бомба',
    text: 'Поймал бомбу — минус жизнь. Упустить не страшно.',
    parts: [
      { mode: 'settings', title: 'Эмодзи бомбы', tab: 0, name: 'bombEmoji', line: BOMB_LINE },
      {
        mode: 'replace',
        title: 'Яблоко или бомба',
        tab: 2,
        code: BOMB_APPLES,
        marks: [/\bfunction\s+makeItem\b/, /\bbombEmoji\b/],
      },
      { mode: 'replace', title: 'Поймал бомбу', tab: 3, code: BOMB_CATCH, marks: [/["']bomb["']/] },
    ],
  },
  {
    n: 5,
    emoji: '🌟',
    title: 'Звезда',
    text: 'Поймал звезду — плюс жизнь. Делается после бомбы.',
    parts: [
      { mode: 'settings', title: 'Эмодзи звезды', tab: 0, name: 'goldEmoji', line: GOLD_LINE },
      {
        mode: 'replace',
        title: 'Яблоко, бомба или звезда',
        tab: 2,
        code: GOLD_APPLES,
        marks: [/\bgoldEmoji\b/, /["']gold["']/],
      },
      { mode: 'replace', title: 'Поймал звезду', tab: 3, code: GOLD_CATCH, marks: [/["']gold["']/] },
    ],
  },
]

export const GUIDE_EXTRAS_NOTE: Rich =
  '«Вставить» заменяет вкладку целиком. Делал «Десять очков» или «Всё быстрее»? [[Ctrl]] + [[Z]] вернёт как было.'

export const GUIDE_MORE_TASKS: GuideTask[] = [
  {
    n: 6,
    title: 'Со звуком',
    text: 'Пищи, когда ловишь, и гуди, когда роняешь.',
    hint: [
      'Готовая функция: `playSound("catch")`. Звуки: `"catch"`, `"miss"`, `"bomb"`, `"star"`, `"over"`.',
      'Вызови её в `checkCatch` рядом с `score` и `lives`.',
    ],
  },
]
