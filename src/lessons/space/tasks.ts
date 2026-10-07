import {
  after,
  createEmojiQuest,
  decl,
  drawEmojiQuest,
  has,
  into,
  numberAbove0,
  numberQuest,
  pickColorQuest,
  pickEmojiQuest,
  runQuest,
  shell,
} from '../kit.ts'
import type { BuildTask } from '../types.ts'
import { BULLET_COLOR, ENEMY_EMOJI, SHIP_EMOJI } from './tabs.ts'

// Квесты Космоса. Код шага собирается кнопками «Добавить» по кусочкам и в итоге совпадает с STEP_* из tabs.ts.
// Шаги 1 и 3 похожи на то, что ученик уже делал в Корзинке и Птичке; новое — в шагах 2 (второй массив и
// перезарядка) и 4 (вложенный цикл).

// ===== Шаг 1. Корабль: создать → выбрать → нарисовать → собрать → полёт → скорость =====

export const SHIP_CREATE_TASK = createEmojiQuest({
  title: 'Создай корабль',
  text: 'Корабль — это смайлик. Открой «Корабль»: там всплывёт строчка с ним — жми «Добавить».',
  tab: 1,
  name: 'shipEmoji',
  emoji: SHIP_EMOJI,
  piece: 'Смайлик корабля',
  comment: 'корабль — любой смайлик',
  doneText: 'Корабль создан! Теперь нажми «Сменить» рядом со смайликом и выбери, кто полетит.',
})

export const SHIP_PICK_TASK = pickEmojiQuest({
  title: 'Выбери корабль',
  text: `Нажми «Сменить» рядом со смайликом ${SHIP_EMOJI} и выбери свой корабль — например, 🛸 или 🐉.`,
  tab: 1,
  name: 'shipEmoji',
  emoji: SHIP_EMOJI,
  hint: `Это строка \`var shipEmoji = "${SHIP_EMOJI}";\` во вкладке «Корабль». Кнопка «Сменить» — прямо рядом с ней. Можно и напечатать смайлик между кавычками самому.`,
})

export const SHIP_DRAW_TASK = drawEmojiQuest({
  title: 'Нарисуй корабль',
  text: 'Движок 60 раз в секунду зовёт `drawShip()`. Собери её по кусочкам — кнопки «Добавить» всплывут в «Корабле».',
  tab: 1,
  fn: 'drawShip',
  emoji: 'shipEmoji',
  x: 'shipX',
  y: 'shipY',
  doneText: 'Все кусочки корабля на месте!',
})

export const SHIP_RUN_TASK = runQuest({
  title: 'Собери игру',
  text: 'Нажми «Собрать» или [[Ctrl]] + [[Enter]] — корабль появится внизу экрана.',
  callout: 'Корабль нарисован! Нажми «Собрать» — и он появится на экране.',
  doneText: 'Вот твой корабль!',
  after: [SHIP_DRAW_TASK],
})

export const SHIP_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Научи корабль летать',
  text: 'Движок зовёт и `moveShip()`: она слушает стрелки и двигает корабль. Это как герой в Корзинке — собери её в «Корабле».',
  tab: 1,
  pieces: [
    shell('moveShip'),
    {
      title: 'Стрелка ← — летим влево',
      plan: into('moveShip', '  if (keys["ArrowLeft"])  shipX = shipX - shipSpeed;'),
      isDone: (code) => has(code, /["']ArrowLeft["']/),
    },
    {
      title: 'Стрелка → — летим вправо',
      plan: into('moveShip', '  if (keys["ArrowRight"]) shipX = shipX + shipSpeed;'),
      isDone: (code) => has(code, /["']ArrowRight["']/),
    },
    {
      title: 'Не улетать за край',
      plan: into(
        'moveShip',
        '\n  // не даём кораблю улететь за край\n  if (shipX < 0)   shipX = 0;\n  if (shipX > 340) shipX = 340;',
      ),
      isDone: (code) => has(code, /\bif\s*\(\s*shipX\s*<\s*0\s*\)/) && has(code, /\bif\s*\(\s*shipX\s*>\s*340\s*\)/),
    },
  ],
  doneText: 'Полёт готов! Но корабль пока стоит: в «Движке» скорость shipSpeed — 0. Следующий квест — в «Гайде».',
}

export const SHIP_SPEED_TASK = numberQuest({
  title: 'Скорость корабля',
  text: 'Корабль стоит, потому что в «Движке» `shipSpeed` — 0. Поставь 6, нажми «Собрать» и проверь стрелками.',
  tab: 0,
  name: 'shipSpeed',
  hint: 'Это первая строка «Движка»: `var shipSpeed   = 0;`. Это сколько пикселей корабль пролетает за кадр: 4 — спокойно, 8 — очень шустро.',
})

// ===== Шаг 2. Пули: выстрел → полёт → отрисовка → скорость → луч → перезарядка → её время → цвет =====

const PUSH_BULLET = /\bbullets\.push\s*\(/

export const SHOOT_TASK: BuildTask = {
  kind: 'build',
  title: 'Выстрел',
  text: 'Пули — второй массив, `bullets`, рядом с пришельцами. Собери `shoot()` в «Пулях»: зажат пробел — в массив добавляется новая пуля.',
  tab: 2,
  pieces: [
    shell('shoot'),
    {
      title: 'Пробел — новая пуля из носа корабля',
      plan: into(
        'shoot',
        '  // пробел — новая пуля из носа корабля\n  if (keys[" "]) {\n    bullets.push({ x: shipX + 15, y: shipY - 34 });\n  }',
      ),
      isDone: (code) => has(code, PUSH_BULLET),
    },
  ],
  doneText: 'Выстрел готов! В «Приборах» видно, как растёт bullets. Дальше пули полетят.',
}

export const BULLETS_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Пули летят',
  text: 'Собери `moveBullets()`: каждая пуля летит вверх — это минус к `y`. Улетела за верх — убираем, иначе массив будет расти вечно.',
  tab: 2,
  pieces: [
    shell('moveBullets'),
    {
      title: 'Все пули летят вверх',
      plan: into(
        'moveBullets',
        '  // все пули летят вверх\n  for (var i = 0; i < bullets.length; i++) {\n    bullets[i].y = bullets[i].y - bulletSpeed;\n  }',
      ),
      isDone: (code) => has(code, /(-|-=)\s*bulletSpeed\b/),
    },
    {
      title: 'Убрать пулю за верхним краем',
      plan: into(
        'moveBullets',
        '\n  // пуля улетела за верхний край — убираем её\n  if (bullets.length > 0 && bullets[0].y < -20) {\n    bullets.shift();\n  }',
      ),
      isDone: (code) => has(code, /\bbullets\.shift\s*\(/),
    },
  ],
  doneText: 'Пули умеют летать! Осталось их нарисовать.',
}

export const BULLETS_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй пули',
  text: 'Собери `drawBullets()`: пуля — узкий прямоугольник 4 × 14 цветом `bulletColor` из «Движка».',
  tab: 2,
  pieces: [
    shell('drawBullets'),
    {
      title: 'Кисточка цвета пуль',
      plan: into('drawBullets', '  ctx.fillStyle = bulletColor;'),
      isDone: (code) => has(code, /\bctx\.fillStyle\s*=\s*bulletColor\b/),
    },
    {
      title: 'Каждая пуля — чёрточка',
      plan: into(
        'drawBullets',
        '  for (var i = 0; i < bullets.length; i++) {\n    ctx.fillRect(bullets[i].x, bullets[i].y, 4, 14);\n  }',
      ),
      isDone: (code) => has(code, /\bctx\.fillRect\s*\(\s*bullets\s*\[/),
    },
  ],
  doneText:
    'Пули нарисованы! Но они висят у носа корабля: в «Движке» скорость bulletSpeed — 0. Следующий квест — в «Гайде».',
}

export const BULLET_SPEED_TASK = numberQuest({
  title: 'Скорость пуль',
  text: 'Пули не летят: в «Движке» `bulletSpeed` — 0. Поставь 9 — пуля должна быть намного быстрее пришельцев.',
  tab: 0,
  name: 'bulletSpeed',
  hint: 'Это вторая строка «Движка»: `var bulletSpeed = 0;`. Это сколько пикселей пуля пролетает за кадр. 9 — в самый раз.',
})

/** Пули стреляют, летят и рисуются, но перезарядки ещё нет: в запуске видно сплошной луч. */
export const BEAM_RUN_TASK = runQuest({
  title: 'Сплошной луч',
  text: 'Нажми «Собрать», кликни по экрану и зажми пробел. Посмотри, сколько пуль в `bullets` в «Приборах».',
  callout: 'Пули готовы! Нажми «Собрать», потом зажми пробел.',
  doneText: 'Видишь сплошной луч? Пуля вылетает каждый кадр — 60 в секунду. Так нечестно: нужна перезарядка.',
  after: [SHOOT_TASK, BULLETS_MOVE_TASK, BULLETS_DRAW_TASK],
  also: (ran) => numberAbove0('bulletSpeed')(ran[0] ?? ''),
})

export const RELOAD_TASK: BuildTask = {
  kind: 'build',
  title: 'Перезарядка',
  text: 'Счётчик `reload` — сколько кадров ещё ждать. Выстрелил — счётчик заряжается, потом каждый кадр уменьшается на 1. Стрелять можно, только когда он 0.',
  tab: 2,
  pieces: [
    {
      title: 'Ждём, пока счётчик дойдёт до нуля',
      plan: (code) =>
        after(
          code,
          decl('shoot'),
          '  // перезарядка: пока счётчик не дошёл до нуля — не стреляем\n  if (reload > 0) {\n    reload = reload - 1;\n    return;\n  }\n',
        ),
      isDone: (code) => has(code, /\breload\s*(=\s*reload\s*-\s*1\b|-=\s*1\b|--)/),
    },
    {
      title: 'Выстрелил — заряжаем заново',
      plan: (code) => after(code, PUSH_BULLET, '    reload = reloadTime;'),
      isDone: (code) => has(code, /\breload\s*=\s*reloadTime\b/),
    },
  ],
  doneText:
    'Перезарядка готова! Но луч остался: в «Движке» время перезарядки reloadTime — 0. Следующий квест — в «Гайде».',
}

export const RELOAD_TIME_TASK = numberQuest({
  title: 'Время перезарядки',
  text: 'В «Движке» `reloadTime` — 0: счётчик сразу ноль, и корабль снова стреляет каждый кадр. Поставь 15 — луч станет очередью.',
  tab: 0,
  name: 'reloadTime',
  hint: 'Это третья строка «Движка»: `var reloadTime  = 0;`. Это сколько кадров ждать между выстрелами. 15 — четыре выстрела в секунду, 30 — два.',
})

export const BULLET_COLOR_TASK = pickColorQuest({
  title: 'Цвет пуль',
  text: 'Пули жёлтые, потому что так написано в «Движке»: `bulletColor`. Нажми «Сменить» рядом с цветом и выбери свой, потом «Собрать».',
  tab: 0,
  name: 'bulletColor',
  color: BULLET_COLOR,
  hint: `Это строка \`var bulletColor = "${BULLET_COLOR}";\` в «Движке». Кнопка «Сменить» с квадратиком цвета — прямо рядом с ней. Можно напечатать и название цвета по-английски: "red", "cyan", "lime".`,
})

// ===== Шаг 3. Пришельцы: волна → отрисовка → скорость → зигзаг → свой пришелец =====

const WAVE_UP = /\bwave\s*(=\s*wave\s*\+|\+=)/

export const WAVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Волна пришельцев',
  text: 'Собери `moveEnemies()` в «Пришельцах»: когда пришельцев не осталось, цикл `for` сразу добавляет целую волну — каждого в случайном месте, — и все они спускаются вниз.',
  tab: 3,
  pieces: [
    shell('moveEnemies'),
    {
      title: 'Пришельцев нет — новая волна',
      plan: into(
        'moveEnemies',
        '  // пришельцев не осталось — летит новая волна\n  if (enemies.length === 0) {\n    wave = wave + 1;\n  }',
      ),
      isDone: (code) => has(code, /\benemies\.length\s*===?\s*0\b/) && has(code, WAVE_UP),
    },
    {
      title: 'В волне waveSize пришельцев — прилетают по одному',
      plan: (code) =>
        after(
          code,
          WAVE_UP,
          '    for (var k = 0; k < waveSize; k++) {\n      // в случайном месте, каждый следующий выше — прилетают по одному;\n      // dx — своя скорость вбок у каждого\n      enemies.push({ x: Math.random() * 340, y: 40 - k * 60, dx: 0.5 + Math.random() * 1.5 });\n    }',
        ),
      isDone: (code) => has(code, /\benemies\.push\s*\(/),
    },
    {
      title: 'Все пришельцы спускаются вниз',
      plan: into(
        'moveEnemies',
        '\n  for (var i = 0; i < enemies.length; i++) {\n    var a = enemies[i];\n    // все спускаются вниз\n    a.y = a.y + enemySpeed;\n  }',
      ),
      isDone: (code) => has(code, /(\+|\+=)\s*enemySpeed\b/),
    },
  ],
  doneText: 'Волна готова! В «Приборах» видно enemies и wave. Но пришельцев пока не видно — дальше нарисуем.',
}

export const ENEMIES_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй пришельцев',
  text: 'Собери `drawEnemies()`: каждый пришелец — смайлик `enemyEmoji` из «Движка».',
  tab: 3,
  pieces: [
    shell('drawEnemies'),
    {
      title: 'Размер смайлика',
      plan: into('drawEnemies', '  ctx.font = "34px serif";'),
      isDone: (code) => has(code, /\bctx\.font\s*=/),
    },
    {
      title: 'Каждый пришелец — смайлик',
      plan: into(
        'drawEnemies',
        '  for (var i = 0; i < enemies.length; i++) {\n    ctx.fillText(enemyEmoji, enemies[i].x, enemies[i].y);\n  }',
      ),
      isDone: (code) => has(code, /\bctx\.fillText\s*\(\s*enemyEmoji\b/),
    },
  ],
  doneText: 'Пришельцы нарисованы! Но они висят: в «Движке» скорость enemySpeed — 0. Следующий квест — в «Гайде».',
}

export const ENEMY_SPEED_TASK = numberQuest({
  title: 'Скорость пришельцев',
  text: 'Пришельцы висят: в «Движке» `enemySpeed` — 0. Поставь 1, нажми «Собрать» — и волна поползёт вниз.',
  tab: 0,
  name: 'enemySpeed',
  hint: 'Это четвёртая строка «Движка»: `var enemySpeed  = 0;`. Это сколько пикселей пришельцы спускаются за кадр: `0.5` — медленно (дробные числа — через точку), 1 — в самый раз, 2 — очень быстро.',
})

const A_DOWN = /\ba\.y\s*(=\s*a\.y\s*\+|\+=)\s*enemySpeed\b/

export const ZIGZAG_TASK: BuildTask = {
  kind: 'build',
  title: 'Зигзаг',
  text: 'Пришельцы ползут строго вниз — в таких попасть легко. Но у каждого в волне есть своя скорость вбок, `dx`. Прибавь её к `x`, а у края экрана разверни: `dx` станет `-dx`.',
  tab: 3,
  pieces: [
    {
      title: 'Летят вбок, у края — разворот',
      plan: (code) =>
        after(
          code,
          A_DOWN,
          '    // и летят вбок зигзагом: у края — разворот\n    a.x = a.x + a.dx;\n    if (a.x < 0 || a.x > 340) a.dx = -a.dx;',
        ),
      isDone: (code) => has(code, /\ba\.dx\s*=\s*-\s*a\.dx\b/),
    },
  ],
  doneText: 'Зигзаг готов! Нажми «Собрать» — теперь пришельцы мечутся, и целиться надо с упреждением.',
}

export const ENEMY_PICK_TASK = pickEmojiQuest({
  title: 'Свой пришелец',
  text: `Пришелец ${ENEMY_EMOJI} записан в «Движке»: \`enemyEmoji\`. Нажми «Сменить» рядом с ним и выбери, кто нападает, — например, 👽 или 🐙.`,
  tab: 0,
  name: 'enemyEmoji',
  emoji: ENEMY_EMOJI,
  hint: `Это строка \`var enemyEmoji  = "${ENEMY_EMOJI}";\` в «Движке». Кнопка «Сменить» — прямо рядом с ней.`,
})

// ===== Шаг 4. Попадание: вложенный цикл → очко → прорыв =====

const VAR_A = /\bvar\s+a\s*=\s*enemies\s*\[\s*i\s*\]/
const VAR_B = /\bvar\s+b\s*=\s*bullets\s*\[\s*j\s*\]/
const POPAL = /\bvar\s+popal\s*=/
const SPLICE_BULLET = /\bbullets\.splice\s*\(\s*j\b/

export const HITS_TASK: BuildTask = {
  kind: 'build',
  title: 'Каждая пуля × каждый пришелец',
  text: 'Собери `checkHits()` в «Попадании». Тут новое — цикл в цикле: для каждого пришельца перебираем все пули. 5 пришельцев × 4 пули = 20 проверок каждый кадр.',
  tab: 4,
  pieces: [
    shell('checkHits'),
    {
      title: 'Перебрать всех пришельцев',
      plan: into(
        'checkHits',
        '  // каждый пришелец × каждая пуля\n  for (var i = enemies.length - 1; i >= 0; i--) {\n    var a = enemies[i];\n  }',
      ),
      isDone: (code) => has(code, VAR_A),
    },
    {
      title: 'Для каждого — перебрать все пули',
      plan: (code) =>
        after(code, VAR_A, '\n    for (var j = bullets.length - 1; j >= 0; j--) {\n      var b = bullets[j];\n    }'),
      isDone: (code) => has(code, VAR_B),
    },
    {
      title: 'Пуля внутри рамки пришельца?',
      plan: (code) =>
        after(
          code,
          VAR_B,
          '      // пуля внутри рамки пришельца?\n      var popal = b.x + 4 > a.x && b.x < a.x + 34 && b.y < a.y && b.y + 14 > a.y - 30;',
        ),
      isDone: (code) => has(code, POPAL),
    },
    {
      title: 'Попал — убрать обоих и выйти из цикла',
      plan: (code) =>
        after(
          code,
          POPAL,
          '\n      if (popal) {\n        // сбил — убираем и пришельца, и пулю\n        enemies.splice(i, 1);\n        bullets.splice(j, 1);\n        // этого пришельца больше нет — другие пули его уже не проверяют\n        break;\n      }',
        ),
      isDone: (code) => has(code, /\bif\s*\(\s*popal\b/) && has(code, SPLICE_BULLET) && has(code, /\bbreak\s*;/),
    },
  ],
  doneText: 'Попадания готовы! Нажми «Собрать» и сбей пару пришельцев. Только счёт пока не растёт.',
}

export const SCORE_TASK: BuildTask = {
  kind: 'build',
  title: 'Очко за пришельца',
  text: 'Сбил пришельца — плюс очко. Добавь его прямо в `if (popal)`, рядом с `splice`.',
  tab: 4,
  pieces: [
    {
      title: 'Сбил — плюс очко',
      plan: (code) => after(code, SPLICE_BULLET, '        // плюс очко\n        score = score + 1;'),
      isDone: (code) => has(code, /\bscore\s*(=\s*score\s*\+|\+=)/),
    },
  ],
  doneText: 'Счёт готов! Последний квест — что будет, если пришелец долетел.',
}

export const BREACH_TASK: BuildTask = {
  kind: 'build',
  title: 'Пришелец прорвался',
  text: 'Пришелец долетел до корабля — минус жизнь. Это отдельный цикл после вложенного: пули тут не нужны.',
  tab: 4,
  pieces: [
    {
      title: 'Долетел до корабля — минус жизнь',
      plan: into(
        'checkHits',
        '\n  // пришелец долетел до корабля — минус жизнь\n  for (var i = enemies.length - 1; i >= 0; i--) {\n    if (enemies[i].y > shipY - 10) {\n      lives = lives - 1;\n      enemies.splice(i, 1);\n    }\n  }',
      ),
      isDone: (code) => has(code, /\blives\s*(=\s*lives\s*-|-=)/),
    },
  ],
  doneText: 'Игра готова! Нажми «Собрать» — сколько волн продержишься?',
}
