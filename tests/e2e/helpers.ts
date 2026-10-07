import { expect, type Page, test } from '@playwright/test'

/** Адрес песочницы в текущем проекте проверок: файл через file:// или сайт в подпапке. */
export const app = () => test.info().project.use.baseURL!
export const KEY = 'catch-sandbox-v1'

/** Открыть игру Catch с чистым хранилищем и дождаться редактора и игры. */
export async function open(page: Page, query = '?game=catch') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(app() + query)
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  await waitGame(page)
  return errors
}

/** Дождаться, пока в iframe загрузится движок. */
export async function waitGame(page: Page) {
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')?.contentWindow as (Window & { loop?: unknown }) | null
    return typeof w?.loop === 'function'
  })
}

/** Вычислить выражение внутри игры. */
export function game<T = unknown>(page: Page, expr: string): Promise<T> {
  return page.evaluate((e) => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { eval(x: string): unknown }
    return w.eval(e) as never
  }, expr)
}

/** Кнопка «Собрать» в шапке (в гайде есть такая же у квеста «Собери игру»). */
export const runButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /^Собрать/ })

export async function run(page: Page) {
  // каждый запуск — новый iframe: помечаем старый и ждём новый
  await page.evaluate(() => {
    ;(document.querySelector('iframe')!.contentWindow as Window & { __old?: number }).__old = 1
  })
  await runButton(page).click()
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')?.contentWindow as (Window & { __old?: number }) | null
    return !!w && !w.__old && w.document.readyState === 'complete'
  })
}

export async function tab(page: Page, title: string | RegExp) {
  await page.getByRole('tab', { name: title }).click()
}

/** Код всех вкладок из localStorage (после записи). */
export async function savedCodes(page: Page): Promise<string[]> {
  await page.waitForTimeout(500)
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY)
}

/** Кнопка квеста в гайде: шаг n, подпись кнопки. quest — дождаться, что в гайде уже этот квест. */
export async function openQuest(page: Page, n: number, button: string | RegExp, quest?: string) {
  await tab(page, 'Гайд')
  const step = page.locator(`#guide-step-${n}`)
  const scope = quest ? step.getByRole('region', { name: `Квест: ${quest}` }) : step
  await scope.getByRole('button', { name: button }).click()
}

/** Нажать «Добавить» у всплывающих в коде кусков `count` раз подряд. */
export async function addPieces(page: Page, count: number) {
  const add = page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })
  for (let i = 0; i < count; i++) await add.click()
}

/** Выбрать смайлик в открытом окне выбора. */
export async function pick(page: Page, emoji: string) {
  await page.getByRole('dialog', { name: 'Выбери смайлик' }).getByRole('button', { name: emoji, exact: true }).click()
}

/** Шаг 1, квесты 1–4: создать героя, выбрать смайлик, нарисовать, собрать. */
export async function drawHero(page: Page, emoji = '🐱') {
  await openQuest(page, 1, 'Открыть «Герой»')
  await addPieces(page, 1)
  await page.locator('.cm-emojiPick').first().click()
  await pick(page, emoji)
  await addPieces(page, 3)
  await run(page)
}

/** Шаг 1, квесты 5–6: движение по кусочкам и скорость в «Движке». */
export async function moveHero(page: Page, speed = '6') {
  await openQuest(page, 1, 'Открыть «Герой»', 'Научи героя ездить')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Дай герою скорость')
  await page.keyboard.type(speed)
}

/** Весь шаг 1. */
export async function buildHero(page: Page, emoji = '🐱') {
  await drawHero(page, emoji)
  await moveHero(page)
}

/** Шаг 2, квесты 1–3: яблоки падают, рисуются, скорость в «Движке». */
export async function buildApples(page: Page) {
  await openQuest(page, 2, 'Открыть «Яблоки»')
  await addPieces(page, 4 + 3)
  await openQuest(page, 2, 'Открыть «Движок»', 'Дай яблокам скорость')
  await page.keyboard.type('3')
}

/** Шаг 2, квест 3: собрать speedUp — кнопки «Добавить» всплывают прямо в коде «Яблок». */
export async function completeSpeedUp(page: Page) {
  await openQuest(page, 2, 'Открыть «Яблоки»', 'Всё быстрее')
  await addPieces(page, 4)
  await expect(page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })).toHaveCount(0)
}

/** Шаг 2, квест 4: кнопка в гайде открывает окно смайликов у 🍎 в «Движке». */
export async function completeItem(page: Page, emoji = '🍩') {
  await openQuest(page, 2, 'Выбрать смайлик в «Движок»')
  await pick(page, emoji)
}

/** Шаг 3: собрать checkCatch и дать 10 очков — кнопка выделяет «1», печатаем «10». */
export async function buildCatch(page: Page) {
  await openQuest(page, 3, 'Открыть «Поимка»')
  await addPieces(page, 4)
  await openQuest(page, 3, 'Открыть «Поимка»', 'Десять очков')
  await page.keyboard.type('10')
}

/** Вся основная игра: три шага со всеми квестами. */
export async function buildGame(page: Page) {
  await buildHero(page)
  await buildApples(page)
  await completeSpeedUp(page)
  await completeItem(page)
  await buildCatch(page)
  await tab(page, 'Гайд')
}
