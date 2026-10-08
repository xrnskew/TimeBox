import { describe, expect, it } from 'vitest'
import { isPicture, PICTURE_GROUPS, PICTURE_NAMES, pictureSvg, pictureUrl, UNKNOWN_PICTURE } from '@/core/pictures.ts'

describe('Рисунки', () => {
  it('31 рисунок в пяти группах, имена не повторяются; «?» — не в окне выбора', () => {
    expect(PICTURE_GROUPS.map((g) => g.title)).toEqual(['Герои', 'Еда', 'Вещи', 'Летают', 'Космос'])
    expect(PICTURE_NAMES).toHaveLength(31)
    expect(new Set(PICTURE_NAMES).size).toBe(31)
    for (const name of PICTURE_NAMES) expect(isPicture(name), name).toBe(true)
    expect(isPicture(UNKNOWN_PICTURE)).toBe(false)
    expect(PICTURE_NAMES).not.toContain(UNKNOWN_PICTURE)
  })

  it('каждый рисунок — правильный SVG 64×64: теги закрыты, атрибуты не повторяются, градиенты на месте', () => {
    for (const name of [...PICTURE_NAMES, UNKNOWN_PICTURE]) {
      const svg = pictureSvg(name)
      expect(svg, name).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/)
      expect(svg, name).not.toMatch(/undefined|NaN|\$\{/)
      const open: string[] = []
      for (const [, close, tag, attrs, self] of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
        if (close) {
          expect(open.pop(), `${name}: </${tag}>`).toBe(tag)
          continue
        }
        const names = [...attrs.matchAll(/\s([a-zA-Z:-]+)="[^"]*"/g)].map((m) => m[1])
        expect(new Set(names).size, `${name}: <${tag}${attrs}>`).toBe(names.length)
        if (!self) open.push(tag)
      }
      expect(open, name).toEqual([])
      const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
      for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids.has(ref), `${name}: #${ref}`).toBe(true)
    }
  })

  it('рисунок как адрес картинки: data:image/svg+xml', () => {
    expect(pictureUrl('ракета')).toBe(`data:image/svg+xml,${encodeURIComponent(pictureSvg('ракета'))}`)
  })

  it('неизвестное имя — знак вопроса', () => {
    expect(pictureSvg('ракто')).toBe(pictureSvg(UNKNOWN_PICTURE))
    expect(pictureSvg('ракета')).not.toBe(pictureSvg(UNKNOWN_PICTURE))
  })
})
