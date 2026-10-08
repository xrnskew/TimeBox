import { describe, expect, it } from 'vitest'
import { isPicture, PALETTE, PICTURE_GROUPS, PICTURE_NAMES, pictureGrid, UNKNOWN_PICTURE } from '@/core/pictures.ts'

describe('Рисунки', () => {
  it('31 рисунок в пяти группах, имена не повторяются; «?» — не в окне выбора', () => {
    expect(PICTURE_GROUPS.map((g) => g.title)).toEqual(['Герои', 'Еда', 'Вещи', 'Летают', 'Космос'])
    expect(PICTURE_NAMES).toHaveLength(31)
    expect(new Set(PICTURE_NAMES).size).toBe(31)
    for (const name of PICTURE_NAMES) expect(isPicture(name), name).toBe(true)
    expect(isPicture(UNKNOWN_PICTURE)).toBe(false)
    expect(PICTURE_NAMES).not.toContain(UNKNOWN_PICTURE)
  })

  it('каждый рисунок — 17×17 клеток только из цветов палитры', () => {
    for (const name of [...PICTURE_NAMES, UNKNOWN_PICTURE]) {
      const grid = pictureGrid(name)
      expect(grid, name).toHaveLength(17)
      for (const row of grid) {
        expect(row, name).toHaveLength(17)
        for (const c of row) expect(c === '.' || c in PALETTE, `${name}: «${c}»`).toBe(true)
      }
    }
  })

  it('контур замкнут: ни одна цветная клетка не касается пустоты, по краю — только контур', () => {
    for (const name of PICTURE_NAMES) {
      const g = pictureGrid(name)
      const at = (x: number, y: number) => g[y]?.[x] ?? '.'
      for (let y = 0; y < 17; y++)
        for (let x = 0; x < 17; x++) {
          const c = at(x, y)
          if (c === '.' || c === 'k') continue
          const touches = [at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1)].includes('.')
          expect(touches, `${name}: клетка ${x},${y}`).toBe(false)
        }
      expect(g[0].replace(/[.k]/g, ''), name).toBe('')
      expect(g[16].replace(/[.k]/g, ''), name).toBe('')
    }
  })

  it('неизвестное имя — знак вопроса', () => {
    expect(pictureGrid('ракто')).toEqual(pictureGrid(UNKNOWN_PICTURE))
    expect(pictureGrid('ракета')).not.toEqual(pictureGrid(UNKNOWN_PICTURE))
  })
})
