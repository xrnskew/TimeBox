import { PALETTE, pictureGrid } from '@/core/pictures.ts'

// Рисунок как картинка для интерфейса (окно выбора, кнопка «Сменить», меню): data-URL, по `cell` пикселей на клетку.
// Показывать с `image-rendering: pixelated`, чтобы клетки не размывались.

const cache = new Map<string, string>()

export function pictureUrl(name: string, cell = 4): string {
  const key = `${name}:${cell}`
  const hit = cache.get(key)
  if (hit) return hit
  const grid = pictureGrid(name)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 17 * cell
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  grid.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return
      ctx.fillStyle = PALETTE[c]
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }),
  )
  const url = canvas.toDataURL()
  cache.set(key, url)
  return url
}
