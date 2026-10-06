import { expect, test } from '@playwright/test'
import { game, insertStep, open, run, savedCodes, tab } from './helpers.ts'

// Чек-лист из раздела 11 ТЗ + новые функции. Каждый тест — с чистым хранилищем
// (у каждого теста свой контекст браузера).

test('1. игра уже крутится, вкладки шагов пустые, ошибок нет', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveAttribute('aria-selected', 'true')
  for (const t of ['Герой', 'Яблоки', 'Поимка'])
    await expect(page.getByRole('tab', { name: t })).toHaveAccessibleName(/пока только комментарий/)
  expect(await game(page, 'typeof loop')).toBe('function')
  expect(await game(page, 'lives')).toBe(3)
  expect(errors).toEqual([])
})

test('2. шаг 1: корзина ездит стрелками, страница не прокручивается', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('status')).toContainText('Теперь нажми «Запустить»')
  await run(page)
  // игра забрала фокус сама
  await expect(page.getByText('Двигай корзину')).toBeVisible()
  await expect(page.getByText('Кликни, чтобы играть')).toHaveCount(0)
  // клик в редактор уводит фокус, клик по игре — возвращает
  await page.locator('.cm-content').click()
  await expect(page.getByText('Кликни, чтобы играть')).toBeVisible()
  await page.getByText('Кликни, чтобы играть').click()
  await expect(page.getByText('Двигай корзину')).toBeVisible()
  const x0 = await game<number>(page, 'playerX')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.keyboard.up('ArrowRight')
  expect(await game<number>(page, 'playerX')).toBeGreaterThan(x0 + 30)
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(150)
  await page.keyboard.up('ArrowLeft')
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAccessibleName(/шаг сделан/)
})

test('3. шаги 2 и 3: яблоки падают и ловятся, жизни кончаются', async ({ page }) => {
  await open(page)
  for (const n of [1, 2, 3]) await insertStep(page, n)
  await expect(page.getByRole('button', { name: /Шаг 3, «Поимка»: сделан$/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Прогресс по шагам' })).toContainText('3/3')
  await run(page)
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { items?: unknown[] }
    return (w.items?.length ?? 0) > 0
  })
  await game(page, 'items = [{ x: playerX, y: playerY }]; checkCatch()')
  expect(await game(page, 'score')).toBe(1)
  await game(page, 'lives = 1; items = [{ x: 0, y: 600 }]; playerX = 300; checkCatch()')
  expect(await game(page, 'lives')).toBe(0)
  await expect(page.getByRole('button', { name: 'Сыграть ещё' })).toBeVisible()
  await expect(page.getByText('Рекорд:')).toBeVisible()
})

test('4. сломанная скобка и ошибка выполнения: верная вкладка и строка', async ({ page }) => {
  await open(page)
  await insertStep(page, 3)
  // удаляем } цикла for — предпоследняя строка «Поимки»
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('End')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.getByRole('button', { name: 'Запустить' }).click()
  const bar = page.getByRole('alert')
  await expect(bar).toContainText('Ошибка во вкладке «Поимка», строка 2: скобка { открыта, но не закрыта')
  await expect(page.locator('iframe').locator('xpath=..')).toHaveAttribute('data-game', 'blocked')
  expect(await page.evaluate(() => !!document.activeElement?.closest('.cm-editor'))).toBe(true)
  await expect(page.getByRole('tab', { name: 'Поимка' })).toHaveAccessibleName(/ошибка/)
  await page.keyboard.press('ControlOrMeta+z')
  await page.keyboard.press('ControlOrMeta+z')

  // ошибка выполнения в «Герое»
  await insertStep(page, 1)
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

test('8. бомба и звезда: строка в «Движке», повтор — «уже есть», логика', async ({ page }) => {
  await open(page)
  for (const n of [1, 2, 3]) await insertStep(page, n)
  await tab(page, 'Гайд')
  const bomb = page.locator('#guide-task-4')
  await bomb.getByRole('button', { name: 'Добавить строку в «Движок»' }).click()
  let codes = await savedCodes(page)
  const lines = codes[0].split('\n')
  expect(lines[6]).toBe('var bombEmoji   = "💣";')
  expect(lines[1]).toBe('var playerSpeed = 6;')
  await expect(page.getByRole('status')).toContainText('Остальные настройки на месте')

  await tab(page, 'Гайд')
  await bomb.getByRole('button', { name: 'Добавить строку в «Движок»' }).click()
  await expect(page.getByRole('status')).toContainText('уже есть')
  await expect(page.getByRole('status').getByRole('button', { name: 'Вернуть как было' })).toHaveCount(0)
  codes = await savedCodes(page)
  expect(codes[0].match(/bombEmoji/g)).toHaveLength(1)

  const star = page.locator('#guide-task-5')
  await tab(page, 'Гайд')
  await star.getByRole('button', { name: 'Добавить строку в «Движок»' }).click()
  for (const name of ['Вставить во вкладку «Яблоки»', 'Вставить во вкладку «Поимка»']) {
    await tab(page, 'Гайд')
    await star.getByRole('button', { name }).click()
  }
  await tab(page, 'Гайд')
  await expect(star.getByText('уже есть в коде')).toHaveCount(3)
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
  await insertStep(page, 2)
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
  await page.getByRole('status').getByRole('button', { name: 'Вернуть как было' }).click()
  codes = await savedCodes(page)
  expect(codes[1]).toContain('function movePlayer()')
  expect(codes[2]).toContain('function moveItems()')
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
  const external: string[] = []
  await context.route('**/*', (route) => {
    const url = route.request().url()
    if (!/^(file|data|about|blob):/.test(url)) {
      external.push(url)
      return route.abort()
    }
    return route.continue()
  })
  await open(page)
  await insertStep(page, 1)
  await run(page)
  expect(await page.evaluate(() => document.fonts.check('16px Onest'))).toBe(true)
  expect(
    await page.evaluate(
      async () => (await document.fonts.ready, [...document.fonts].filter((f) => f.status === 'loaded').length),
    ),
  ).toBeGreaterThan(0)
  expect(external).toEqual([])
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

test('консоль, «Приборы», пауза и шаг по кадрам', async ({ page }) => {
  await open(page)
  await insertStep(page, 1)
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

  await page.getByRole('button', { name: 'Пауза' }).click()
  await page.waitForTimeout(100)
  const f1 = await game<number>(page, 'frame')
  await page.waitForTimeout(300)
  expect(await game<number>(page, 'frame')).toBe(f1)
  await page.getByRole('button', { name: 'Кадр' }).click()
  await expect.poll(() => game<number>(page, 'frame')).toBe(f1 + 1)
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expect.poll(() => game<number>(page, 'frame')).toBeGreaterThan(f1 + 5)

  // не больше 60 кадров в секунду
  const a = await game<number>(page, 'frame')
  await page.waitForTimeout(1000)
  const perSecond = (await game<number>(page, 'frame')) - a
  expect(perSecond).toBeGreaterThan(30)
  expect(perSecond).toBeLessThan(66)

  await page.getByRole('button', { name: 'Границы' }).click()
  await expect(page.getByRole('button', { name: 'Границы' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Замедлить' }).click()
  await expect(page.getByRole('button', { name: 'Замедлить' })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: 'test-results/shots/tools.png' })
})

test('ссылка на игру: открывается чужая игра, код можно взять себе', async ({ page, browser }) => {
  await open(page)
  await insertStep(page, 1)
  await page.getByRole('button', { name: 'Поделиться' }).click()
  const field = page.getByRole('textbox', { name: 'Ссылка на игру' })
  await expect(field).toHaveValue(/#play=z/)
  const url = await field.inputValue()

  // у друга своё хранилище — отдельный контекст браузера
  const friend = await browser.newContext()
  const other = await friend.newPage()
  await other.goto(url)
  await expect(other.getByText('Это игра по ссылке')).toBeVisible()
  await other.getByRole('button', { name: 'Взять код себе' }).click()
  await expect(other.getByText('Это игра по ссылке')).toBeHidden()
  await other.waitForTimeout(600)
  const codes = await other.evaluate(() => JSON.parse(localStorage.getItem('catch-sandbox-v1')!))
  expect(codes[1]).toContain('function movePlayer()')
  expect(other.url()).not.toContain('#play=')
  await friend.close()
})

test('готовая версия: своё сохранение, гайда нет, список «Что тут есть»', async ({ page }) => {
  await open(page, '?finished')
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Что тут есть' })).toBeVisible()
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "apple" }]; checkCatch()')
  expect(await game(page, 'score')).toBe(10)
  await tab(page, 'Поимка') // смена вкладки сохраняет сразу
  expect(await page.evaluate(() => localStorage.getItem('catch-sandbox-finished-v1'))).not.toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('catch-sandbox-v1'))).toBeNull()
})

test('режим проектора и размер кода', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Вид' }).click()
  await page.getByRole('button', { name: /Режим проектора/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'projector')
  await page.getByRole('button', { name: 'Крупнее' }).click()
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--code-size'))).toBe('15px')
  await page.keyboard.press('Escape')
  await tab(page, 'Движок')
  await page.screenshot({ path: 'test-results/shots/projector.png' })
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
