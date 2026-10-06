import type { GuideExtra, GuideIntro, GuideStep, Rich } from '../types.ts'
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
import { BASKET_TASK, SPEEDUP_TASK, TEN_POINTS_TASK } from './tasks.ts'

// Тон: для подростка, который программирует впервые. Коротко, на «ты».
// Подробности спрятаны за кнопкой «Как это работает».
// В тексте `код` — инлайн-код, [[Ctrl]] — клавиша.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Собери игру за три шага',
  lead: 'Вставь код шага, нажми «Запустить» и выполни задание — тогда откроется следующий шаг.',
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
    task: BASKET_TASK,
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
    task: SPEEDUP_TASK,
  },
  {
    step: 3,
    tab: 3,
    title: 'Поймал или уронил',
    lead: 'Поймал — очко, уронил — минус жизнь.',
    how: [
      'Яблоко рядом с корзиной и опустилось до неё — поймано: `score` растёт.',
      'Улетело ниже поля (`y > 500`) — минус жизнь.',
      'Цикл идёт с конца: `items.splice` вырезает яблоко и сдвигает остальные.',
    ],
    code: STEP_CATCH,
    checks: ['Поймал — счёт растёт', 'Три промаха — «Игра окончена»'],
    fns: ['checkCatch'],
    task: TEN_POINTS_TASK,
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 4,
    emoji: '💣',
    title: 'Бомба',
    text: 'Поймал бомбу — минус жизнь. Упустить не страшно.',
    setting: { tab: 0, name: 'bombEmoji', line: BOMB_LINE },
    codes: [
      { tab: 2, code: BOMB_APPLES, marks: [/\bfunction\s+makeItem\b/, /\bbombEmoji\b/] },
      { tab: 3, code: BOMB_CATCH, marks: [/["']bomb["']/] },
    ],
  },
  {
    n: 5,
    emoji: '🌟',
    title: 'Звезда',
    text: 'Поймал звезду — плюс жизнь. Откроется после бомбы.',
    setting: { tab: 0, name: 'goldEmoji', line: GOLD_LINE },
    codes: [
      { tab: 2, code: GOLD_APPLES, marks: [/\bgoldEmoji\b/, /["']gold["']/] },
      { tab: 3, code: GOLD_CATCH, marks: [/["']gold["']/] },
    ],
  },
]

export const GUIDE_EXTRAS_NOTE: Rich =
  'Вторая кнопка заменяет «Яблоки» и «Поимку» целиком — ускорение и 10 очков в новом коде уже есть. Передумал? [[Ctrl]] + [[Z]] в каждой вкладке.'
