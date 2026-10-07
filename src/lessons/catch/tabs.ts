import type { LessonVariant, TabDef } from '../types.ts'

// Движок учебной версии — из ТЗ, с отличиями: смайлик героя ученик создаёт сам во вкладке «Герой»,
// а скорости героя и яблок — 0: их ученик ставит сам в квестах после движения и после яблок. Строк bombEmoji
// и goldEmoji тоже нет: их ученик добавляет в заданиях про бомбу и звезду.
export const TUTORIAL_ENGINE = `// ===== НАСТРОЙКИ =====
var playerSpeed = 0;
var fallSpeed   = 0;
var spawnEvery  = 60;
var itemEmoji   = "🍎";

// ===== СОСТОЯНИЕ ИГРЫ =====
var playerX = 170;
var playerY = 440;
var items = [];
var score = 0;
var lives = 3;
var frame = 0;
var keys = {};

// ===== КЛАВИШИ =====
document.addEventListener("keydown", function (e) { keys[e.key] = true; });
document.addEventListener("keyup",   function (e) { keys[e.key] = false; });

// ===== ЗАГОТОВКИ =====
// Пока пустые. Твои функции из других вкладок их заменят.
function movePlayer() {}
function drawPlayer() {}
function moveItems()  {}
function drawItems()  {}
function checkCatch() {}

// ===== ГЛАВНЫЙ ЦИКЛ =====
function loop() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, 380, 470);

  if (lives > 0) {
    movePlayer();
    moveItems();
    checkCatch();
  }
  drawPlayer();
  drawItems();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("Счёт: " + score, 12, 26);
  ctx.fillText("Жизни: " + lives, 12, 48);

  if (lives <= 0) {
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Игра окончена", 78, 240);
  }
  requestAnimationFrame(loop);
}
loop();`

export const BOMB_LINE = 'var bombEmoji   = "💣";'
export const GOLD_LINE = 'var goldEmoji   = "🌟";'

// ===== Код шагов гайда — базовая версия: только яблоки, +1 очко, скорость постоянная =====
// Каждый шаг собирается кнопками по кусочкам (tasks.ts) и в итоге совпадает с этим кодом.

/** Смайлик героя, с которого начинают. Квест «Выбери героя» — поменять его на свой. */
export const HERO_EMOJI = '🙂'

export const STEP_HERO = `// герой — любой смайлик
var playerEmoji = "${HERO_EMOJI}";

function drawPlayer() {
  ctx.font = "34px serif";
  ctx.fillText(playerEmoji, playerX, playerY);
}

function movePlayer() {
  if (keys["ArrowLeft"])  playerX = playerX - playerSpeed;
  if (keys["ArrowRight"]) playerX = playerX + playerSpeed;

  // не даём герою уехать за край поля
  if (playerX < 0)   playerX = 0;
  if (playerX > 340) playerX = 340;
}`

export const STEP_APPLES = `function moveItems() {
  frame = frame + 1;

  // раз в spawnEvery кадров — новое яблоко в случайном месте сверху
  if (frame % spawnEvery === 0) {
    items.push({ x: Math.random() * 340, y: 0 });
  }

  // все яблоки опускаются вниз
  for (var i = 0; i < items.length; i++) {
    items[i].y = items[i].y + fallSpeed;
  }
}

function drawItems() {
  ctx.font = "34px serif";

  for (var i = 0; i < items.length; i++) {
    ctx.fillText(itemEmoji, items[i].x, items[i].y);
  }
}`

export const STEP_CATCH = `function checkCatch() {
  for (var i = items.length - 1; i >= 0; i--) {
    var blizko = Math.abs(items[i].x - playerX) < 34;

    if (blizko && items[i].y > playerY - 34) {
      // поймал — плюс очко
      score = score + 1;
      items.splice(i, 1);

    } else if (items[i].y > 500) {
      // уронил — минус жизнь
      lives = lives - 1;
      items.splice(i, 1);
    }
  }
}`

// ===== Задание после шага 2: функция ускорения, её собирают кнопками по частям =====

export const SPEEDUP_FN = `// каждые 15 секунд игра становится быстрее
function speedUp() {
  if (frame % 900 === 0 && fallSpeed < 8) {
    fallSpeed = fallSpeed + 1;
  }
}`

// ===== Бомба и звезда: основа — код после всех заданий (ускорение и 10 очков) =====

const moveItemsWith = (spawn: string) => `function moveItems() {
  frame = frame + 1;
  speedUp();

  // раз в spawnEvery кадров — новый предмет в случайном месте сверху
  if (frame % spawnEvery === 0) {
    items.push(${spawn});
  }

  // все предметы опускаются вниз
  for (var i = 0; i < items.length; i++) {
    items[i].y = items[i].y + fallSpeed;
  }
}`

export const BOMB_APPLES = `// новый предмет: обычно яблоко, иногда бомба
function makeItem() {
  var kind = "apple";
  if (Math.random() < 0.2) kind = "bomb";
  return { x: Math.random() * 340, y: 0, kind: kind };
}

${moveItemsWith('makeItem()')}

function drawItems() {
  ctx.font = "34px serif";

  for (var i = 0; i < items.length; i++) {
    var emoji = itemEmoji;
    if (items[i].kind === "bomb") emoji = bombEmoji;
    ctx.fillText(emoji, items[i].x, items[i].y);
  }
}

${SPEEDUP_FN}`

export const BOMB_CATCH = `function checkCatch() {
  for (var i = items.length - 1; i >= 0; i--) {
    var blizko = Math.abs(items[i].x - playerX) < 34;

    if (blizko && items[i].y > playerY - 34) {
      if (items[i].kind === "bomb") {
        // поймал бомбу — минус жизнь
        lives = lives - 1;
      } else {
        // поймал яблоко — десять очков
        score = score + 10;
      }
      items.splice(i, 1);

    } else if (items[i].y > 500) {
      // уронил яблоко — минус жизнь, а бомбу упустить не страшно
      if (items[i].kind === "apple") lives = lives - 1;
      items.splice(i, 1);
    }
  }
}`

export const GOLD_APPLES = `// новый предмет: обычно яблоко, иногда бомба или звезда
function makeItem() {
  var r = Math.random();
  var kind = "apple";
  if (r < 0.18) kind = "bomb";
  else if (r < 0.26) kind = "gold";
  return { x: Math.random() * 340, y: 0, kind: kind };
}

${moveItemsWith('makeItem()')}

function drawItems() {
  ctx.font = "34px serif";

  for (var i = 0; i < items.length; i++) {
    var emoji = itemEmoji;
    if (items[i].kind === "bomb") emoji = bombEmoji;
    if (items[i].kind === "gold") emoji = goldEmoji;
    ctx.fillText(emoji, items[i].x, items[i].y);
  }
}

${SPEEDUP_FN}`

export const GOLD_CATCH = `function checkCatch() {
  for (var i = items.length - 1; i >= 0; i--) {
    var blizko = Math.abs(items[i].x - playerX) < 34;

    if (blizko && items[i].y > playerY - 34) {
      if (items[i].kind === "bomb") {
        // поймал бомбу — минус жизнь
        lives = lives - 1;
      } else if (items[i].kind === "gold") {
        // поймал звезду — плюс жизнь
        lives = lives + 1;
      } else {
        // поймал яблоко — десять очков
        score = score + 10;
      }
      items.splice(i, 1);

    } else if (items[i].y > 500) {
      // уронил яблоко — минус жизнь, а бомбу и звезду упустить не страшно
      if (items[i].kind === "apple") lives = lives - 1;
      items.splice(i, 1);
    }
  }
}`

// ===== Готовая версия (?finished): бомба, звезда, +10 очков, ускорение каждые 15 секунд до 8 =====

const FINISHED_ENGINE = TUTORIAL_ENGINE.replace('var playerSpeed = 0;', 'var playerSpeed = 6;')
  .replace('var fallSpeed   = 0;', 'var fallSpeed   = 3;')
  .replace('var itemEmoji   = "🍎";', `var itemEmoji   = "🍎";\n${BOMB_LINE}\n${GOLD_LINE}`)

const FINISHED_HERO = STEP_HERO.replace(`"${HERO_EMOJI}"`, '"🧺"')

// ===== Вкладки =====

const placeholder = (step: number, what: string) =>
  `// Шаг ${step}. ${what}\n// Не знаешь, с чего начать? Открой вкладку «Гайд».`

export const TUTORIAL_TABS: TabDef[] = [
  {
    id: 'engine',
    title: 'Движок',
    note: 'Готовый движок: настройки, состояние игры и главный цикл. Настройки сверху можно менять.',
  },
  {
    id: 'hero',
    title: 'Герой',
    step: 1,
    note: 'Шаг 1: герой — смайлик, который рисуется на холсте и ездит стрелками.',
  },
  { id: 'apples', title: 'Яблоки', step: 2, note: 'Шаг 2: яблоки появляются сверху и падают вниз.' },
  { id: 'catch', title: 'Поимка', step: 3, note: 'Шаг 3: поймал — очко, уронил — минус жизнь.' },
]

export const TUTORIAL_CODES: string[] = [
  TUTORIAL_ENGINE,
  placeholder(1, 'Здесь будет твой герой: смайлик, drawPlayer и movePlayer.'),
  placeholder(2, 'Здесь будут функции moveItems и drawItems.'),
  placeholder(3, 'Здесь будет функция checkCatch.'),
]

export const FINISHED_TABS: TabDef[] = [
  { id: 'engine', title: 'Движок', note: 'Настройки, состояние игры и главный цикл. Эмодзи и скорости можно менять.' },
  { id: 'hero', title: 'Герой', note: 'Корзина: смайлик, отрисовка и движение стрелками.' },
  { id: 'apples', title: 'Яблоки', note: 'Предметы: яблоко, бомба или звезда. Каждые 15 секунд всё падает быстрее.' },
  { id: 'catch', title: 'Поимка', note: 'Яблоко — 10 очков, бомба — минус жизнь, звезда — плюс жизнь.' },
]

export const FINISHED_CODES: string[] = [FINISHED_ENGINE, FINISHED_HERO, GOLD_APPLES, GOLD_CATCH]

export const TUTORIAL: LessonVariant = {
  id: 'tutorial',
  storageKey: 'catch-sandbox-v1',
  tabs: TUTORIAL_TABS,
  initial: TUTORIAL_CODES,
  hasGuide: true,
}

export const FINISHED: LessonVariant = {
  id: 'finished',
  storageKey: 'catch-sandbox-finished-v1',
  tabs: FINISHED_TABS,
  initial: FINISHED_CODES,
  hasGuide: false,
  features: [
    '🍎 Яблоко даёт 10 очков. Уронил — минус жизнь.',
    '💣 Бомба: поймал — минус жизнь, упустил — ничего страшного.',
    '🌟 Звезда: поймал — плюс жизнь.',
    'Каждые 15 секунд всё падает быстрее, но не быстрее скорости 8.',
    'Скорости, частоту появления и смайлики можно менять в «Движке» и «Герое».',
  ],
}
