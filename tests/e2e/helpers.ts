import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, type Page } from '@playwright/test'

export const APP = pathToFileURL(resolve('dist/index.html')).href
export const KEY = 'catch-sandbox-v1'

/** Открыть песочницу с чистым хранилищем и дождаться редактора и игры. */
export async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(APP + query)
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

export async function run(page: Page) {
  // каждый запуск — новый iframe: помечаем старый и ждём новый
  await page.evaluate(() => {
    ;(document.querySelector('iframe')!.contentWindow as Window & { __old?: number }).__old = 1
  })
  await page.getByRole('button', { name: 'Запустить' }).click()
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

export async function insertStep(page: Page, n: number) {
  await tab(page, 'Гайд')
  const tabTitle = ['Герой', 'Яблоки', 'Поимка'][n - 1]
  await page
    .locator(`#guide-step-${n}`)
    .getByRole('button', { name: `Вставить во вкладку «${tabTitle}»` })
    .click()
}
