import { expect, test } from '@playwright/test'
import {
  app,
  buildGame,
  completeBasket,
  completeItem,
  game,
  insertStep,
  open,
  run,
  savedCodes,
  tab,
  waitGame,
} from './helpers.ts'

// Чек-лист из раздела 11 ТЗ + задания после шагов, бомба и звезда, пароль.
// Каждый тест — с чистым хранилищем (у каждого теста свой контекст браузера).

test('1. игра уже крутится, вкладки шагов пустые, ошибок нет', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveAttribute('aria-selected', 'true')
  for (const t of ['Герой', 'Яблоки', 'Поимка'])
    await expect(page.getByRole('tab', { name: t })).toHaveAccessibleName(/пока только комментарий/)
  expect(await game(page, 'typeof loop')).toBe('function')
  expect(await game(page, 'lives')).toBe(3)
  expect(await game(page, 'typeof playSound')).toBe('undefined')
  // сверху — название конструктора, в гайде — название игры
  await expect(page.getByRole('banner')).toContainText('TimeBox')
  await expect(page.getByRole('heading', { level: 1, name: 'Catch' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Собрать' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Прогресс' }).getByRole('button')).toHaveCount(5)
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('0/5')
  expect(errors).toEqual([])
})

test('2. шаг 1: корзина ездит стрелками, страница не прокручивается', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('status')).toContainText('Теперь нажми «Собрать»')
  await run(page)
  // игра забрала фокус сама
  await expect(page.getByText('Играем: жми')).toBeVisible()
  await expect(page.getByText('Кликни, чтобы играть')).toHaveCount(0)
  // клик в редактор уводит фокус, клик по игре — возвращает
  await page.locator('.cm-content').click()
  await expect(page.getByText('Кликни, чтобы играть')).toBeVisible()
  await page.getByText('Кликни, чтобы играть').click()
  await expect(page.getByText('Играем: жми')).toBeVisible()
  const x0 = await game<number>(page, 'playerX')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.keyboard.up('ArrowRight')
  expect(await game<number>(page, 'playerX')).toBeGreaterThan(x0 + 30)
  // стрелки на корпусе не забирают фокус: «Кликни, чтобы играть» не всплывает
  const right = page.getByRole('button', { name: 'Вправо' })
  const box = (await right.boundingBox())!
  const x1 = await game<number>(page, 'playerX')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await expect(page.getByText('Кликни, чтобы играть')).toHaveCount(0)
  await page.mouse.up()
  expect(await game<number>(page, 'playerX')).toBeGreaterThan(x1 + 30)
  await expect(page.getByText('Играем: жми')).toBeVisible()
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAccessibleName(/шаг сделан/)
})

test('шаги открываются по очереди: сначала задание', async ({ page }) => {
  await open(page)
  const step2 = page.locator('#guide-step-2')
  await expect(step2).toHaveAttribute('data-state', 'locked')
  await expect(step2.getByRole('button', { name: /^Вставить/ })).toHaveCount(0)

  await insertStep(page, 1)
  await tab(page, 'Гайд')
  await expect(page.locator('#guide-step-1')).toContainText('Осталось задание')
  await expect(step2).toHaveAttribute('data-state', 'locked')

  // кнопка открывает «Движок» и выделяет корзину — печатаем новый смайлик
  await completeBasket(page)
  expect((await savedCodes(page))[0]).toContain('var playerEmoji = "🐱";')
  await tab(page, 'Гайд')
  await expect(page.locator('#guide-step-1')).toHaveAttribute('data-state', 'done')
  await expect(step2).toHaveAttribute('data-state', 'active')
  await expect(page.locator('#guide-step-3')).toHaveAttribute('data-state', 'locked')
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('1/5')
})

test('«Всё быстрее»: части функции всплывают в коде «Яблок» и добавляются по очереди', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  await completeBasket(page)
  await insertStep(page, 2)
  // в гайде кнопок нет — только какие части на месте и переход во вкладку
  await tab(page, 'Гайд')
  const guideTask = page.locator('#guide-step-2')
  // второй квест прячется, пока не собрано ускорение
  await expect(guideTask.getByRole('region', { name: /^Задание:/ })).toHaveCount(1)
  await expect(guideTask.getByRole('button', { name: /^Добавить:/ })).toHaveCount(0)
  await expect(guideTask.getByRole('list', { name: 'Части функции' }).getByRole('listitem')).toHaveCount(4)

  await guideTask.getByRole('button', { name: 'Открыть «Яблоки»' }).click()
  const add = page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })
  const titles = [
    'Пустая функция speedUp',
    'Раз в 15 секунд, пока скорость меньше 8',
    'Прибавить скорость',
    'Вызывать каждый кадр в moveItems',
  ]
  for (const t of titles) {
    // всплывает ровно одна часть — следующая по порядку
    await expect(add).toHaveCount(1)
    await expect(add).toHaveAccessibleName(`Добавить: ${t}`)
    if (t === titles[3]) {
      // кусок стоит под строкой «frame = frame + 1;», и номера строк ниже не съехали
      const off = await page.evaluate(() => {
        const g = [...document.querySelectorAll('.cm-lineNumbers .cm-gutterElement')].find(
          (e) => e.textContent === '5',
        )!
        const l = document.querySelectorAll('.cm-line')[4]
        return Math.abs(g.getBoundingClientRect().top - l.getBoundingClientRect().top)
      })
      expect(off).toBeLessThan(1)
    }
    await add.click()
  }
  await expect(add).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Функция собрана')
  const apples = (await savedCodes(page))[2]
  expect(apples).toContain('  frame = frame + 1;\n  speedUp();')
  expect(apples).toContain(
    'function speedUp() {\n  if (frame % 900 === 0 && fallSpeed < 8) {\n    fallSpeed = fallSpeed + 1;\n  }\n}',
  )
  // второй квест открылся только теперь; шаг 3 ждёт его
  await tab(page, 'Гайд')
  const step2 = page.locator('#guide-step-2')
  await expect(step2).toHaveAttribute('data-state', 'active')
  await expect(step2.getByRole('region', { name: 'Задание: Не только яблоки' })).toContainText('Задание 2 из 2')
  await expect(page.locator('#guide-step-3')).toHaveAttribute('data-state', 'locked')
  await completeItem(page, '🐟')
  expect((await savedCodes(page))[0]).toContain('var itemEmoji   = "🐟";')
  await tab(page, 'Гайд')
  await expect(step2).toHaveAttribute('data-state', 'done')
  await expect(page.locator('#guide-step-3')).toHaveAttribute('data-state', 'active')
  await run(page)
  expect(await game(page, 'itemEmoji')).toBe('🐟')
  await game(page, 'frame = 899; moveItems()')
  expect(await game(page, 'fallSpeed')).toBe(4)
  await game(page, 'fallSpeed = 8; frame = 1799; moveItems()')
  expect(await game(page, 'fallSpeed')).toBe(8)
})

test('3. вся игра: яблоки падают и ловятся по 10 очков, жизни кончаются', async ({ page }) => {
  await open(page)
  await buildGame(page)
  await expect(page.getByRole('button', { name: /Шаг 3, «Поимка»: сделано$/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('3/5')
  await run(page)
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { items?: unknown[] }
    return (w.items?.length ?? 0) > 0
  })
  await game(page, 'items = [{ x: playerX, y: playerY }]; checkCatch()')
  expect(await game(page, 'score')).toBe(10)
  await game(page, 'lives = 1; items = [{ x: 0, y: 600 }]; playerX = 300; checkCatch()')
  expect(await game(page, 'lives')).toBe(0)
  // «Начать заново» — посередине экрана приставки
  const restart = page.getByRole('button', { name: 'Начать заново' })
  await expect(restart).toBeVisible()
  await expect(page.getByText('Рекорд:')).toBeVisible()
  const screen = (await page.locator('iframe').boundingBox())!
  const btn = (await restart.boundingBox())!
  const mid = (b: { y: number; height: number }) => b.y + b.height / 2
  expect(Math.abs(mid(btn) - mid(screen))).toBeLessThan(screen.height * 0.15)
})

test('4. сломанная скобка и ошибка выполнения: верная вкладка и строка', async ({ page }) => {
  await open(page)
  await buildGame(page)
  await tab(page, 'Поимка')
  // удаляем } цикла for — предпоследняя строка «Поимки»
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('End')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.getByRole('button', { name: 'Собрать' }).click()
  const bar = page.getByRole('alert')
  await expect(bar).toContainText('Ошибка во вкладке «Поимка», строка 2: скобка { открыта, но не закрыта')
  await expect(page.locator('iframe').locator('xpath=..')).toHaveAttribute('data-game', 'blocked')
  expect(await page.evaluate(() => !!document.activeElement?.closest('.cm-editor'))).toBe(true)
  await expect(page.getByRole('tab', { name: 'Поимка' })).toHaveAccessibleName(/ошибка/)
  await page.keyboard.press('ControlOrMeta+z')
  await page.keyboard.press('ControlOrMeta+z')

  // ошибка выполнения в «Герое»
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('drawBasket();')
  await page.keyboard.press('Escape')
  await run(page)
  await expect(bar).toContainText('Ошибка во вкладке «Герой», строка 14: drawBasket не найдено')
  await bar.getByRole('button', { name: 'Показать' }).click()
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.cm-errorLine')).toHaveCount(1)
})

test('5–7. сохранение, сброс вкладки не трогает движок, Ctrl+Z и Ctrl+Shift+Z', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  // настройка в «Движке»: playerSpeed = 9
  await tab(page, 'Движок')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('9;')
  expect((await savedCodes(page))[0]).toContain('var playerSpeed = 9;')

  await page.reload()
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  let codes = await savedCodes(page)
  expect(codes[0]).toContain('var playerSpeed = 9;')
  expect(codes[1]).toContain('function movePlayer()')

  await tab(page, 'Герой')
  await page.getByRole('button', { name: 'Сбросить вкладку' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Другие вкладки и настройки в «Движке» останутся как есть')
  await dialog.getByRole('button', { name: 'Сбросить вкладку' }).click()
  await expect(dialog).toBeHidden()
  codes = await savedCodes(page)
  expect(codes[1]).not.toContain('function movePlayer()')
  expect(codes[0]).toContain('var playerSpeed = 9;')

  // фокус вернулся в редактор — Ctrl+Z работает сразу
  expect(await page.evaluate(() => !!document.activeElement?.closest('.cm-editor'))).toBe(true)
  await page.keyboard.press('ControlOrMeta+z')
  expect((await savedCodes(page))[1]).toContain('function movePlayer()')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  expect((await savedCodes(page))[1]).not.toContain('function movePlayer()')
})

test('сброс движка: отдельное предупреждение, фокус на «Отмене»', async ({ page }) => {
  await open(page)
  await tab(page, 'Движок')
  await page.getByRole('button', { name: 'Сбросить движок' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Твои настройки пропадут')
  await expect(dialog.getByRole('button', { name: 'Отмена' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('8. бомба и звезда: закрыты до сборки игры, две кнопки, логика', async ({ page }) => {
  await open(page)
  const bomb = page.locator('#guide-task-4')
  const star = page.locator('#guide-task-5')
  const setting = 'Добавить переменную в «Движок»'
  const code = 'Вставить код в «Яблоки» и «Поимка»'
  await expect(bomb.getByRole('button', { name: setting })).toBeDisabled()

  await buildGame(page)
  await expect(bomb.getByRole('button', { name: setting })).toBeEnabled()
  await expect(bomb.getByRole('button', { name: code })).toBeDisabled()
  await expect(star.getByRole('button', { name: setting })).toBeDisabled()

  await bomb.getByRole('button', { name: setting }).click()
  let codes = await savedCodes(page)
  const lines = codes[0].split('\n')
  expect(lines[6]).toBe('var bombEmoji   = "💣";')
  expect(lines[4]).toBe('var playerEmoji = "🐱";')
  await expect(page.getByRole('status')).toContainText('Остальные настройки на месте')

  // повторно — «уже есть», без кнопки отмены
  await tab(page, 'Гайд')
  await bomb.getByRole('button', { name: setting }).click()
  await expect(page.getByRole('status')).toContainText('уже есть')
  await expect(page.getByRole('status').getByRole('button', { name: 'Вернуть как было' })).toHaveCount(0)

  await tab(page, 'Гайд')
  await bomb.getByRole('button', { name: code }).click()
  codes = await savedCodes(page)
  expect(codes[2]).toContain('if (Math.random() < 0.2) kind = "bomb";')
  expect(codes[3]).toContain('items[i].kind === "bomb"')
  expect(codes[2]).toContain('speedUp();')
  expect(codes[3]).toContain('score = score + 10;')

  await tab(page, 'Гайд')
  await star.getByRole('button', { name: setting }).click()
  await tab(page, 'Гайд')
  await star.getByRole('button', { name: code }).click()
  await tab(page, 'Гайд')
  await expect(star).toHaveAttribute('data-done', 'true')
  // уровни не сломались: ускорение и 10 очков на месте; все пять чек-поинтов пройдены
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('5/5')
  await expect(page.getByRole('button', { name: 'Дополнительно: «Звезда»: сделано' })).toBeVisible()

  await run(page)
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "bomb" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(2)
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "gold" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(3)
  await game(
    page,
    'playerX = 300; items = [{ x: 0, y: 600, kind: "bomb" }, { x: 0, y: 600, kind: "gold" }]; checkCatch()',
  )
  expect(await game(page, 'lives')).toBe(3)
})

test('9. «Сбросить всё»: без слова кнопка неактивна, «Вернуть как было» возвращает код', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  await completeBasket(page)
  await page.getByRole('button', { name: 'Сбросить всё' }).click()
  const dialog = page.getByRole('dialog')
  const confirm = dialog.getByRole('button', { name: 'Сбросить всё' })
  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('сбро')
  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('СБРОС')
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveAttribute('aria-selected', 'true')
  let codes = await savedCodes(page)
  expect(codes[1]).not.toContain('movePlayer()')
  expect(codes[0]).toContain('var playerEmoji = "🧺";')
  await page.getByRole('status').getByRole('button', { name: 'Вернуть как было' }).click()
  codes = await savedCodes(page)
  expect(codes[1]).toContain('function movePlayer()')
  expect(codes[0]).toContain('var playerEmoji = "🐱";')
})

test('10. ширина 375px: нет горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page)
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth)
  expect(await wide()).toBeLessThanOrEqual(375)
  await tab(page, 'Движок')
  expect(await wide()).toBeLessThanOrEqual(375)
  const frame = await page.locator('iframe').boundingBox()
  expect(frame!.width).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/shots/375-engine.png', fullPage: true })
})

test('11. без сети: запросов наружу нет, шрифты загружены', async ({ page, context }) => {
  // свой сервер (сборка для Pages) — можно, всё остальное — «наружу»
  const own = new URL(app())
  const external: string[] = []
  const failed: string[] = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (!/^(file|data|about|blob):$/.test(url.protocol) && url.origin !== own.origin) {
      external.push(url.href)
      return route.abort()
    }
    return route.continue()
  })
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })
  await open(page)
  await insertStep(page, 1)
  await run(page)
  expect(
    await page.evaluate(
      async () => (await document.fonts.ready, [...document.fonts].filter((f) => f.status === 'loaded').length),
    ),
  ).toBeGreaterThan(0)
  expect(external).toEqual([])
  expect(failed).toEqual([])
})

test('шрифты и скрипты берутся по правильному адресу (base)', async ({ page }) => {
  const loaded: string[] = []
  const failed: string[] = []
  page.on('requestfinished', (r) => loaded.push(r.url()))
  page.on('requestfailed', (r) => failed.push(r.url()))
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })
  await open(page)
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    const fams = ['Onest', 'JetBrains Mono', 'Unbounded']
    return fams.map((f) => [...document.fonts].some((x) => x.family.replace(/"/g, '') === f && x.status === 'loaded'))
  })
  expect(fonts).toEqual([true, true, true])
  expect(failed).toEqual([])
  const base = new URL(app())
  if (base.protocol === 'file:') {
    // одиночный файл: всё внутри, кроме самой страницы ничего не грузится
    expect(loaded.filter((u) => !u.startsWith('data:') && !u.startsWith(base.href))).toEqual([])
  } else {
    // сайт в подпапке: скрипт, стили и шрифты — из /TimeBox/assets/
    const assets = loaded.filter((u) => /\.(js|css|woff2)$/.test(u))
    expect(assets.length).toBeGreaterThan(3)
    for (const u of assets) expect(u.startsWith(`${base.origin}/TimeBox/assets/`)).toBe(true)
  }
})

test('живая проверка синтаксиса: значок и подчёркивание до запуска', async ({ page }) => {
  await open(page)
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('function a() {')
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAccessibleName(/ошибка/)
  await expect(page.locator('.cm-lintRange-error, .cm-lintPoint-error').first()).toBeVisible()
})

test('консоль, «Приборы», 60 кадров и «Границы»', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  await completeBasket(page)
  await insertStep(page, 2)
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('console.log("привет", { a: 1.234 });')
  await page.keyboard.press('Escape')
  await run(page)
  await page.getByRole('tab', { name: 'Консоль' }).click()
  await expect(page.locator('#tool-panel')).toContainText('привет {"a":1.23}')

  await page.getByRole('tab', { name: 'Приборы' }).click()
  await expect(page.locator('#tool-panel')).toContainText('lives')
  await expect(page.locator('#tool-panel dd').nth(1)).toHaveText('3')

  // не больше 60 кадров в секунду
  const a = await game<number>(page, 'frame')
  await page.waitForTimeout(1000)
  const perSecond = (await game<number>(page, 'frame')) - a
  expect(perSecond).toBeGreaterThan(30)
  expect(perSecond).toBeLessThan(66)

  const hitboxes = page.getByRole('switch', { name: 'Границы' })
  await hitboxes.click()
  await expect(hitboxes).toHaveAttribute('aria-checked', 'true')
})

test('лишних кнопок нет: «Поделиться», «Вид», пауза, кадр, замедление убраны', async ({ page }) => {
  await open(page)
  for (const name of ['Поделиться', 'Вид', 'Пауза', 'Кадр', 'Замедлить'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
})

test('гайд: код, объяснение и подсказка открываются кнопками', async ({ page }) => {
  await open(page)
  const step = page.locator('#guide-step-1')
  await expect(step.locator('pre')).toHaveCount(0)
  await step.getByRole('button', { name: 'Показать код' }).click()
  await expect(step.locator('pre')).toContainText('function movePlayer()')
  await step.getByRole('button', { name: 'Скрыть код' }).click()
  await expect(step.locator('pre')).toHaveCount(0)
  await step.getByRole('button', { name: 'Как это работает' }).click()
  await expect(step).toContainText('корзина — это просто буква')
  await insertStep(page, 1)
  await tab(page, 'Гайд')
  await step.getByRole('button', { name: 'Подсказка' }).click()
  await expect(step).toContainText('var playerEmoji = "🧺";')
})

test('готовая игра под паролем: из гайда и по прямой ссылке', async ({ page, context }) => {
  await open(page)
  await page.getByRole('button', { name: 'Открыть готовую игру' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Пароль').fill('123456')
  await dialog.getByRole('button', { name: 'Открыть' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Пароль не подошёл')

  await dialog.getByLabel('Пароль').fill('000110')
  const popup = context.waitForEvent('page')
  await dialog.getByRole('button', { name: 'Открыть' }).click()
  const finished = await popup
  await expect(finished.getByRole('heading', { name: 'Что тут есть' })).toBeVisible()
  await expect(finished.getByRole('tab', { name: 'Гайд' })).toHaveCount(0)

  // по прямой ссылке без пароля — экран блокировки
  const direct = await (await page.context().browser()!.newContext()).newPage()
  await direct.goto(`${app()}?finished`)
  await expect(direct.getByRole('heading', { name: 'Готовая игра под паролем' })).toBeVisible()
  await expect(direct.locator('iframe')).toHaveCount(0)
  await direct.getByLabel('Пароль').fill('000110')
  await direct.getByRole('button', { name: 'Открыть' }).click()
  await waitGame(direct)
  await direct.evaluate(() => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { eval(x: string): unknown }
    w.eval('items = [{ x: playerX, y: playerY, kind: "apple" }]; checkCatch()')
  })
  expect(
    await direct.evaluate(() => (document.querySelector('iframe')!.contentWindow as Window & { score: number }).score),
  ).toBe(10)
  expect(await direct.evaluate(() => localStorage.getItem('catch-sandbox-v1'))).toBeNull()
})

test('телефон: экранные стрелки двигают корзину, холст чёткий, а для кода — 380 × 470', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  })
  const page = await ctx.newPage()
  await open(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await insertStep(page, 1)
  await run(page)
  expect(await game(page, '[canvas.width, canvas.height]')).toEqual([380, 470])
  expect(
    await game<number>(page, 'Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width").get.call(canvas)'),
  ).toBeGreaterThan(380)
  const right = page.getByRole('button', { name: 'Вправо' })
  await expect(right).toBeVisible()
  const x0 = await game<number>(page, 'playerX')
  await right.dispatchEvent('pointerdown')
  await page.waitForTimeout(300)
  await right.dispatchEvent('pointerup')
  const x1 = await game<number>(page, 'playerX')
  expect(x1).toBeGreaterThan(x0 + 30)
  await page.waitForTimeout(200)
  expect(await game<number>(page, 'playerX')).toBe(x1)
  await ctx.close()
})

test('основные сценарии подряд — без единой ошибки в консоли', async ({ page, context }) => {
  // слушаем все страницы и кадры: и песочницу, и игру в iframe, и окно готовой игры
  const errors: string[] = []
  const watch = (p: typeof page) => {
    p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`)
    })
  }
  watch(page)
  context.on('page', watch)

  await open(page)
  await buildGame(page)
  await run(page)
  await game(page, 'items = [{ x: playerX, y: playerY }]; checkCatch()')
  expect(await game(page, 'score')).toBe(10)
  await game(page, 'lives = 0')
  await page.getByRole('button', { name: 'Начать заново' }).click()
  await waitGame(page)

  const setting = 'Добавить переменную в «Движок»'
  const code = 'Вставить код в «Яблоки» и «Поимка»'
  for (const n of [4, 5]) {
    await tab(page, 'Гайд')
    await page.locator(`#guide-task-${n}`).getByRole('button', { name: setting }).click()
    await tab(page, 'Гайд')
    await page.locator(`#guide-task-${n}`).getByRole('button', { name: code }).click()
  }
  await run(page)
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "gold" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(4)

  // приборы, консоль, границы
  await page.getByRole('tab', { name: 'Консоль' }).click()
  await page.getByRole('tab', { name: 'Приборы' }).click()
  await page.getByRole('switch', { name: 'Границы' }).click()

  // готовая игра по паролю
  await tab(page, 'Гайд')
  await page.getByRole('button', { name: 'Открыть готовую игру' }).click()
  await page.getByRole('dialog').getByLabel('Пароль').fill('000110')
  const popup = context.waitForEvent('page')
  await page.getByRole('dialog').getByRole('button', { name: 'Открыть' }).click()
  const finished = await popup
  await waitGame(finished)
  await page.waitForTimeout(500)

  expect(errors).toEqual([])
})
