import type { GuideExtra, GuideIntro, GuideStep, Rich } from '../types.ts'
import {
  BOOM_ENEMIES,
  BOOM_HITS,
  BOOM_LINE,
  FAST_ENEMIES,
  MAX_SPEED_LINE,
  STEP_BULLETS,
  STEP_ENEMIES,
  STEP_HITS,
  STEP_SHIP,
} from './tabs.ts'
import {
  BEAM_RUN_TASK,
  BREACH_TASK,
  BULLET_COLOR_TASK,
  BULLET_SPEED_TASK,
  BULLETS_DRAW_TASK,
  BULLETS_MOVE_TASK,
  ENEMIES_DRAW_TASK,
  ENEMY_PICK_TASK,
  ENEMY_SPEED_TASK,
  HITS_TASK,
  RELOAD_TASK,
  RELOAD_TIME_TASK,
  SCORE_TASK,
  SHIP_CREATE_TASK,
  SHIP_DRAW_TASK,
  SHIP_MOVE_TASK,
  SHIP_PICK_TASK,
  SHIP_RUN_TASK,
  SHIP_SPEED_TASK,
  SHOOT_TASK,
  WAVE_TASK,
} from './tasks.ts'

// Тон тот же, что в Корзинке и Птичке: для подростка, коротко, на «ты». Это сложная игра, и новые мысли
// в ней три: второй массив (пули рядом с пришельцами), цикл в цикле и перезарядка — счётчик, который
// каждый кадр уменьшается до нуля.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Космос',
  lead: 'Корабль внизу, сверху волнами летят пришельцы. Стреляй и не дай им долететь. Собирай игру по квестам и жми «Собрать».',
  tips: [
    '[[Ctrl]] + [[Enter]] — собрать',
    '[[Ctrl]] + [[Z]] — отменить правку',
    'Клик по экрану, потом [[←]] [[→]] и [[Пробел]]',
  ],
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    tab: 1,
    title: 'Корабль',
    lead: 'Создай корабль-смайлик, нарисуй его и научи летать стрелками.',
    how: [
      'Движок 60 раз в секунду вызывает `drawShip()` и `moveShip()`.',
      'Это как герой в Корзинке: стрелка зажата — к `shipX` прибавляется или отнимается `shipSpeed`.',
      'Корабль шириной 34 пикселя, поле — 380. Поэтому `shipX` не меньше 0 и не больше 340.',
    ],
    code: STEP_SHIP,
    checks: ['Корабль внизу экрана', 'Стрелки ← → двигают его', 'За край не улетает'],
    fns: ['drawShip', 'moveShip'],
    quests: [SHIP_CREATE_TASK, SHIP_PICK_TASK, SHIP_DRAW_TASK, SHIP_RUN_TASK, SHIP_MOVE_TASK, SHIP_SPEED_TASK],
  },
  {
    step: 2,
    tab: 2,
    title: 'Пули',
    lead: 'Пробел — выстрел. Пули летят вверх, а между выстрелами — перезарядка.',
    how: [
      'Пули — второй массив, `bullets`. Пробел добавляет в него пулю, `moveBullets` двигает все пули вверх, а улетевшую за край убирает `shift()`.',
      'Без перезарядки пуля вылетает каждый кадр — 60 в секунду, получается сплошной луч.',
      'Перезарядка — счётчик `reload`. Выстрелил — в него кладётся `reloadTime`, потом каждый кадр он уменьшается на 1. Пока он не 0, `return` выходит из `shoot` до выстрела.',
    ],
    code: STEP_BULLETS,
    checks: ['Пробел — пули летят вверх', 'Держишь пробел — очередь, а не луч', 'Пули твоего цвета'],
    fns: ['shoot', 'moveBullets', 'drawBullets'],
    quests: [
      SHOOT_TASK,
      BULLETS_MOVE_TASK,
      BULLETS_DRAW_TASK,
      BULLET_SPEED_TASK,
      BEAM_RUN_TASK,
      RELOAD_TASK,
      RELOAD_TIME_TASK,
      BULLET_COLOR_TASK,
    ],
  },
  {
    step: 3,
    tab: 3,
    title: 'Пришельцы',
    lead: 'Сверху летят волны пришельцев. Кончились — летит новая.',
    how: [
      'Пришельцы — массив `enemies`. Когда он пустой, цикл `for` добавляет сразу `waveSize` пришельцев — целую волну.',
      'Каждый следующий в волне правее на 70 и выше на 45 пикселей — лесенкой. Поэтому до корабля они долетают по одному, а не все разом.',
      'Пришельцы пока пролетают сквозь пули — попадания будут в шаге 4.',
    ],
    code: STEP_ENEMIES,
    checks: ['Сверху волна пришельцев', 'Волна ползёт вниз', 'Номер волны — слева сверху'],
    fns: ['moveEnemies', 'drawEnemies'],
    quests: [WAVE_TASK, ENEMIES_DRAW_TASK, ENEMY_SPEED_TASK, ENEMY_PICK_TASK],
  },
  {
    step: 4,
    tab: 4,
    title: 'Попадание',
    lead: 'Пуля попала в пришельца — он сбит. Долетел до корабля — минус жизнь.',
    how: [
      'Чтобы найти попадания, надо проверить каждую пару «пришелец и пуля». Поэтому цикл в цикле: для каждого пришельца `a` перебираем все пули `b`.',
      'Оба цикла идут с конца, как в Корзинке: `splice` сдвигает массив, и с начала следующий элемент проскочил бы.',
      '`break` выходит из цикла по пулям: пришельца уже нет, и другие пули его не проверяют — иначе одна цель дала бы два очка.',
      'Второй цикл — новый, `i` в нём начинается заново. Пришелец ниже `shipY - 10` долетел — минус жизнь. Жизней 0 — «Игра окончена».',
    ],
    code: STEP_HITS,
    checks: ['Попал — пришелец и пуля пропадают, счёт растёт', 'Пришелец долетел — минус жизнь'],
    fns: ['checkHits'],
    quests: [HITS_TASK, SCORE_TASK, BREACH_TASK],
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 5,
    emoji: '💥',
    title: 'Взрывы',
    text: 'Сбил пришельца — на его месте 20 кадров горит взрыв. Взрывы — третий массив, `booms`.',
    setting: { tab: 0, name: 'boomEmoji', line: BOOM_LINE },
    codes: [
      { tab: 3, code: BOOM_ENEMIES, marks: [/\bboomEmoji\b/] },
      { tab: 4, code: BOOM_HITS, marks: [/\bbooms\.push\s*\(/] },
    ],
  },
  {
    n: 6,
    emoji: '🌊',
    title: 'Волна за волной',
    text: 'Каждая новая волна быстрее прошлой, но не быстрее `maxSpeed`. Откроется после взрывов.',
    setting: { tab: 0, name: 'maxSpeed', line: MAX_SPEED_LINE },
    codes: [{ tab: 3, code: FAST_ENEMIES, marks: [/\bmaxSpeed\b/] }],
  },
]

export const GUIDE_EXTRAS_NOTE: Rich =
  'Вторая кнопка заменяет «Пришельцев» и «Попадание» целиком — очки, прорыв и волны в новом коде уже есть. Передумал? [[Ctrl]] + [[Z]] в каждой вкладке.'
