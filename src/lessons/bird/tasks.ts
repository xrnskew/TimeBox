import { after, append, emojiOf, emojiTarget, has, into, numberAbove0, numberTarget, shell } from '../kit.ts'
import type { BuildTask, EditTask, RunTask } from '../types.ts'
import { BIRD_EMOJI } from './tabs.ts'

// Квесты Птички. Код шага собирается кнопками «Добавить» по кусочкам и в итоге совпадает с STEP_* из tabs.ts.

// ===== Шаг 1. Птица: создать → выбрать → нарисовать → собрать → падение → гравитация =====

const BIRD_VAR = /\bvar\s+birdEmoji\s*=/

export const BIRD_CREATE_TASK: BuildTask = {
  kind: 'build',
  title: 'Создай птицу',
  text: 'Птица — это смайлик. Открой «Птица»: там всплывёт строчка с ним — жми «Добавить».',
  tab: 1,
  pieces: [
    {
      title: 'Смайлик птицы',
      plan: append(`// птица — любой смайлик\nvar birdEmoji = "${BIRD_EMOJI}";`),
      isDone: (code) => has(code, BIRD_VAR),
    },
  ],
  doneText: 'Птица создана! Теперь нажми «Сменить» рядом со смайликом и выбери, кто полетит.',
}

export const BIRD_PICK_TASK: EditTask = {
  kind: 'edit',
  title: 'Выбери птицу',
  text: `Нажми «Сменить» рядом со смайликом ${BIRD_EMOJI} и выбери, кто полетит, — например, 🦉 или 🐝.`,
  tab: 1,
  target: emojiTarget('birdEmoji'),
  picker: true,
  hint: [
    `Это строка \`var birdEmoji = "${BIRD_EMOJI}";\` во вкладке «Птица». Кнопка «Сменить» — прямо рядом с ней. Можно и напечатать смайлик между кавычками самому.`,
  ],
  isDone(code) {
    const emoji = emojiOf('birdEmoji', code)
    return !!emoji && emoji !== BIRD_EMOJI
  },
}

const BIRD_TEXT = /\bctx\.fillText\s*\(\s*birdEmoji\s*,\s*birdX\s*,\s*birdY\s*\)/

export const BIRD_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй птицу',
  text: 'Движок 60 раз в секунду зовёт `drawBird()`. Собери её по кусочкам — кнопки «Добавить» всплывут в «Птице».',
  tab: 1,
  pieces: [
    shell('drawBird'),
    {
      title: 'Размер смайлика',
      plan: into('drawBird', '  ctx.font = "34px serif";'),
      isDone: (code) => has(code, /\bctx\.font\s*=/),
    },
    {
      title: 'Нарисовать смайлик в точке birdX, birdY',
      plan: into('drawBird', '  ctx.fillText(birdEmoji, birdX, birdY);'),
      isDone: (code) => has(code, BIRD_TEXT),
    },
  ],
  doneText: 'Все кусочки птицы на месте!',
}

export const BIRD_RUN_TASK: RunTask = {
  kind: 'run',
  title: 'Собери игру',
  text: 'Нажми «Собрать» или [[Ctrl]] + [[Enter]] — птица появится на экране.',
  tab: 1,
  callout: 'Птица нарисована! Нажми «Собрать» — и она появится на экране.',
  doneText: 'Вот твоя птица!',
  isDone: (ran) => BIRD_DRAW_TASK.pieces.every((p) => p.isDone(ran[1] ?? '')),
}

const GRAVITY_STEP = /\bspeedY\s*(=\s*speedY\s*\+|\+=)\s*gravity\b/
const SPEED_STEP = /\bbirdY\s*(=\s*birdY\s*\+|\+=)\s*speedY\b/

export const BIRD_FALL_TASK: BuildTask = {
  kind: 'build',
  title: 'Птица падает',
  text: 'Движок зовёт и `moveBird()`. Тут новое: у птицы есть скорость `speedY`. Гравитация прибавляется к скорости, а скорость — к высоте `birdY`.',
  tab: 1,
  pieces: [
    shell('moveBird'),
    {
      title: 'Гравитация прибавляется к скорости',
      plan: into('moveBird', '  // гравитация разгоняет птицу вниз\n  speedY = speedY + gravity;'),
      isDone: (code) => has(code, GRAVITY_STEP),
    },
    {
      title: 'Скорость прибавляется к высоте',
      plan: into('moveBird', '  // скорость двигает птицу\n  birdY = birdY + speedY;'),
      isDone: (code) => has(code, SPEED_STEP),
    },
    {
      title: 'Не проваливаться под землю и не улетать выше неба',
      plan: into(
        'moveBird',
        '\n  // не даём птице провалиться под землю и улететь выше неба\n  if (birdY > 460) {\n    birdY = 460;\n    speedY = 0;\n  }\n  if (birdY < 30) {\n    birdY = 30;\n    speedY = 0;\n  }',
      ),
      isDone: (code) => has(code, /\bif\s*\(\s*birdY\s*>\s*460\s*\)/) && has(code, /\bif\s*\(\s*birdY\s*<\s*30\s*\)/),
    },
  ],
  doneText: 'Падение готово! Но птица пока висит: в «Движке» гравитация gravity — 0. Следующий квест — в «Гайде».',
}

export const GRAVITY_TASK: EditTask = {
  kind: 'edit',
  title: 'Включи гравитацию',
  text: 'Птица висит, потому что в «Движке» `gravity` — 0. Поставь 0.4, нажми «Собрать», потом пробел — и птица полетит вниз.',
  tab: 0,
  target: numberTarget('gravity'),
  hint: [
    'Это первая строка «Движка»: `var gravity   = 0;`. Дробные числа пишутся через точку: `0.4`. Каждый кадр скорость падения растёт на это число — птица падает всё быстрее, как настоящий камень.',
  ],
  isDone: numberAbove0('gravity'),
}

// ===== Шаг 2. Взмах: собрать flap → сила взмаха =====

export const FLAP_TASK: BuildTask = {
  kind: 'build',
  title: 'Взмах',
  text: 'Пробел зовёт `flap()`. Взмах не двигает птицу сам — он даёт ей скорость вверх, а дальше её снова тянет гравитация.',
  tab: 2,
  pieces: [
    shell('flap'),
    {
      title: 'Скорость — вверх',
      plan: into('flap', '  // взмах: скорость сразу вверх (вверх — это минус)\n  speedY = -flapPower;'),
      isDone: (code) => has(code, /\bspeedY\s*=\s*-\s*flapPower\b/),
    },
  ],
  doneText: 'Взмах готов! Но птица не подлетает: в «Движке» сила взмаха flapPower — 0. Следующий квест — в «Гайде».',
}

export const FLAP_POWER_TASK: EditTask = {
  kind: 'edit',
  title: 'Сила взмаха',
  text: 'В «Движке» `flapPower` — 0, поэтому взмах ничего не делает. Поставь 7, нажми «Собрать» и держи птицу в воздухе пробелом.',
  tab: 0,
  target: numberTarget('flapPower'),
  hint: [
    'Это вторая строка «Движка»: `var flapPower = 0;`. Чем больше число, тем выше подлетает птица: 5 — чуть-чуть, 10 — до самого неба.',
  ],
  isDone: numberAbove0('flapPower'),
}

// ===== Шаг 3. Трубы: едут → рисуются → скорость =====

const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/

export const PIPES_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Трубы едут',
  text: 'Собери `movePipes()` в «Трубах»: раз в полторы секунды справа появляется труба с дыркой, и все трубы едут влево.',
  tab: 3,
  pieces: [
    shell('movePipes'),
    {
      title: 'Считать кадры',
      plan: into('movePipes', '  frame = frame + 1;'),
      isDone: (code) => has(code, FRAME_TICK),
    },
    {
      title: 'Новая труба с дыркой на случайной высоте',
      plan: into(
        'movePipes',
        '\n  // раз в pipeEvery кадров — новая труба справа, дырка на случайной высоте\n  if (frame % pipeEvery === 0) {\n    pipes.push({ x: 380, top: 60 + Math.random() * 200, passed: false });\n  }',
      ),
      isDone: (code) => has(code, /\bpipes\.push\s*\(/),
    },
    {
      title: 'Все трубы едут влево',
      plan: into(
        'movePipes',
        '\n  // все трубы едут влево\n  for (var i = 0; i < pipes.length; i++) {\n    pipes[i].x = pipes[i].x - pipeSpeed;\n  }',
      ),
      isDone: (code) => has(code, /(-|-=)\s*pipeSpeed\b/),
    },
    {
      title: 'Убрать трубу за левым краем',
      plan: into(
        'movePipes',
        '\n  // труба уехала за левый край — убираем её\n  if (pipes.length > 0 && pipes[0].x < -60) {\n    pipes.shift();\n  }',
      ),
      isDone: (code) => has(code, /\bpipes\.shift\s*\(/),
    },
  ],
  doneText: 'Трубы появляются! В «Приборах» растёт pipes. Но их пока не видно — дальше нарисуем.',
}

export const PIPES_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй трубы',
  text: 'Собери `drawPipes()`: у каждой трубы две части — над дыркой и под ней.',
  tab: 3,
  pieces: [
    shell('drawPipes'),
    {
      title: 'Зелёный цвет',
      plan: into('drawPipes', '  ctx.fillStyle = "#5ec639";'),
      isDone: (code) => has(code, /\bctx\.fillStyle\s*=/),
    },
    {
      title: 'Нарисовать каждую трубу',
      plan: into(
        'drawPipes',
        '\n  for (var i = 0; i < pipes.length; i++) {\n    var p = pipes[i];\n    // верхняя труба — до дырки, нижняя — после неё\n    ctx.fillRect(p.x, 0, 52, p.top);\n    ctx.fillRect(p.x, p.top + pipeGap, 52, 470);\n  }',
      ),
      isDone: (code) => has(code, /\bctx\.fillRect\s*\([^)]*pipeGap/),
    },
  ],
  doneText:
    'Трубы нарисованы! Но они стоят за правым краем: в «Движке» скорость pipeSpeed — 0. Следующий квест — в «Гайде».',
}

export const PIPE_SPEED_TASK: EditTask = {
  kind: 'edit',
  title: 'Скорость труб',
  text: 'Трубы появляются за правым краем, но стоят: в «Движке» `pipeSpeed` — 0. Поставь 2, нажми «Собрать» — и они поедут навстречу.',
  tab: 0,
  target: numberTarget('pipeSpeed'),
  hint: [
    'Это третья строка «Движка»: `var pipeSpeed = 0;`. Это сколько пикселей труба проезжает за кадр. 2 — в самый раз, 4 — очень трудно.',
  ],
  isDone: numberAbove0('pipeSpeed'),
}

// ===== Шаг 4. Удар: собрать checkHit → очко за трубу =====

const HIT_LOOP = /\bfor\s*\(\s*var\s+i\s*=\s*0\s*;\s*i\s*<\s*pipes\.length\b/
const VAR_P = /\bvar\s+p\s*=\s*pipes\s*\[\s*i\s*\]/
const RYADOM = /\bvar\s+ryadom\s*=/

export const HIT_TASK: BuildTask = {
  kind: 'build',
  title: 'Врезался — конец игры',
  text: 'Собери `checkHit()` в «Ударе»: упала на землю или задела трубу — `gameOver = true`, и движок останавливает игру.',
  tab: 4,
  pieces: [
    shell('checkHit'),
    {
      title: 'Упала на землю — конец игры',
      plan: into('checkHit', '  // упал на землю — конец игры\n  if (birdY >= 460) gameOver = true;'),
      isDone: (code) => has(code, /\bif\s*\(\s*birdY\s*>=\s*460\s*\)/),
    },
    {
      title: 'Перебрать все трубы',
      plan: into('checkHit', '\n  for (var i = 0; i < pipes.length; i++) {\n    var p = pipes[i];\n  }'),
      isDone: (code) => has(code, HIT_LOOP) && has(code, VAR_P),
    },
    {
      title: 'Птица над трубой?',
      plan: (code) =>
        after(
          code,
          VAR_P,
          '\n    // птица над трубой по горизонтали?\n    var ryadom = birdX + 34 > p.x && birdX < p.x + 52;',
        ),
      isDone: (code) => has(code, RYADOM),
    },
    {
      title: 'Задела трубу — конец игры',
      plan: (code) =>
        after(
          code,
          RYADOM,
          '\n    if (ryadom && (birdY - 26 < p.top || birdY > p.top + pipeGap)) {\n      // врезался в трубу — конец игры\n      gameOver = true;\n    }',
        ),
      isDone: (code) => has(code, /\bif\s*\(\s*ryadom\b/),
    },
  ],
  doneText: 'Столкновения готовы! Нажми «Собрать» и попробуй пролететь в дырку.',
}

export const SCORE_TASK: BuildTask = {
  kind: 'build',
  title: 'Очко за трубу',
  text: 'Пролетела трубу — плюс очко. Чтобы одна труба не дала очко дважды, запоминаем у неё `passed = true`.',
  tab: 4,
  pieces: [
    {
      title: 'Пролетел трубу — плюс очко',
      plan: (code) =>
        after(
          code,
          VAR_P,
          '\n    // пролетел трубу — плюс очко\n    if (!p.passed && p.x + 52 < birdX) {\n      p.passed = true;\n      score = score + 1;\n    }',
        ),
      isDone: (code) => has(code, /\bp\.passed\s*=\s*true\b/) && has(code, /\bscore\s*(=\s*score\s*\+|\+=)/),
    },
  ],
  doneText: 'Счёт готов! Нажми «Собрать» — сколько труб пролетишь?',
}
