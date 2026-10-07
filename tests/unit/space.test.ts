import { describe, expect, it } from 'vitest'
import { applySettingInsert, planSettingInsert } from '@/core/insert.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import {
  BOOM_ENEMIES,
  BOOM_HITS,
  BOOM_LINE,
  FAST_ENEMIES,
  FINISHED_CODES,
  MAX_SPEED_LINE,
  SHIP_EMOJI,
  STEP_BULLETS,
  STEP_ENEMIES,
  STEP_HITS,
  STEP_SHIP,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/space/tabs.ts'
import { boot, type Sim } from './sim.ts'

/** Движок со своими настройками: по умолчанию всё настроено, как в квестах. */
const engineWith = (ship = 6, bullet = 9, reload = 15, enemy = 0.5) =>
  TUTORIAL_ENGINE.replace('var shipSpeed   = 0;', `var shipSpeed   = ${ship};`)
    .replace('var bulletSpeed = 0;', `var bulletSpeed = ${bullet};`)
    .replace('var reloadTime  = 0;', `var reloadTime  = ${reload};`)
    .replace('var enemySpeed  = 0;', `var enemySpeed  = ${enemy};`)
const withSetting = (engine: string, name: string, line: string) =>
  applySettingInsert(engine, planSettingInsert(engine, name, line))
/** Вся игра без дополнительных заданий. */
const fullGame = (engine = engineWith()) => [engine, STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
/** Игра со взрывами — после задания 5. */
const boomGame = (engine = engineWith()) => [
  withSetting(engine, 'boomEmoji', BOOM_LINE),
  STEP_SHIP,
  STEP_BULLETS,
  BOOM_ENEMIES,
  BOOM_HITS,
]
/** Игра после обоих заданий. */
const fastGame = (engine = engineWith()) => {
  const [boomEngine, ...rest] = boomGame(engine)
  return [withSetting(boomEngine, 'maxSpeed', MAX_SPEED_LINE), ...rest.slice(0, 2), FAST_ENEMIES, BOOM_HITS]
}

const n = (sim: Sim, expr: string) => sim.peek<number>(expr)

describe('Космос: код без ошибок', () => {
  it('все вкладки учебной и готовой версии, шаги и дополнительные задания разбираются', () => {
    const all = [...TUTORIAL_CODES, ...FINISHED_CODES, STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
    for (const code of [...all, BOOM_ENEMIES, BOOM_HITS, FAST_ENEMIES]) expect(findSyntaxError(code)).toBeNull()
  })

  it('каждый шаг по отдельности проходит кадры без ошибки: все массивы объявлены в «Движке»', () => {
    const steps = [STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
    for (const engine of [TUTORIAL_ENGINE, engineWith()])
      for (let i = 0; i < steps.length; i++) {
        const codes = [...TUTORIAL_CODES]
        codes[0] = engine
        codes[i + 1] = steps[i]
        const sim = boot(codes)
        sim.key(' ', true)
        expect(() => sim.tick(30), `шаг ${i + 1}`).not.toThrow()
      }
    expect(() => boot(fullGame(TUTORIAL_ENGINE)).tick(30)).not.toThrow()
    expect(() => boot(boomGame()).tick(30)).not.toThrow()
  })
})

describe('Космос: движок', () => {
  it('без шагов запускается: тёмный космос, 40 звёзд, луна, счёт, жизни и волна', () => {
    const sim = boot(TUTORIAL_CODES)
    sim.tick()
    expect(sim.fills[0]).toBe('#0b0d1a')
    expect(sim.fills.filter((f) => f === '#8b93b8')).toHaveLength(40)
    expect(sim.drawn).toEqual(['🌙', 'Счёт: 0', 'Жизни: 3', 'Волна: 0'])
  })

  it('луна полупрозрачная, а смайлики и надписи после неё — нет', () => {
    for (const codes of [fullGame(), boomGame(), FINISHED_CODES]) {
      const sim = boot(codes)
      sim.peek('booms = [{ x: 200, y: 300, t: 20 }]')
      sim.tick()
      const moon = sim.drawn.indexOf('🌙')
      expect(sim.textAlphas[moon]).toBe(0.5)
      const rest = sim.textAlphas.filter((_, i) => i !== moon)
      expect(rest.length).toBeGreaterThan(5)
      for (const a of rest) expect(a).toBe(1)
    }
  })
})

describe('Космос: корабль', () => {
  it('летает стрелками со скоростью shipSpeed и не вылетает за край', () => {
    const sim = boot(fullGame())
    sim.tick()
    expect(sim.drawn).toContain(SHIP_EMOJI)
    sim.key('ArrowRight', true)
    sim.tick(10)
    expect(n(sim, 'shipX')).toBe(230)
    sim.tick(100)
    expect(n(sim, 'shipX')).toBe(340)
    sim.key('ArrowRight', false)
    sim.key('ArrowLeft', true)
    sim.tick(100)
    expect(n(sim, 'shipX')).toBe(0)
  })

  it('shipSpeed 0 — корабль стоит', () => {
    const sim = boot(fullGame(engineWith(0)))
    sim.key('ArrowLeft', true)
    sim.tick(30)
    expect(n(sim, 'shipX')).toBe(170)
  })
})

describe('Космос: пули и перезарядка', () => {
  /** Пули без попаданий: проверяем только, как они вылетают и летят. */
  const shooting = (engine: string) => {
    const sim = boot(fullGame(engine))
    sim.peek('checkHits = function () {}')
    sim.key(' ', true)
    return sim
  }

  it('без перезарядки пуля вылетает каждый кадр — сплошной луч', () => {
    const sim = shooting(engineWith(6, 9, 0))
    sim.tick(10)
    expect(n(sim, 'bullets.length')).toBe(10)
    expect(sim.peek('bullets[9]')).toEqual({ x: 185, y: 416 - 9 })
  })

  it('с перезарядкой 15 — 4 выстрела в секунду; без пробела не стреляет', () => {
    const sim = shooting(engineWith(6, 0, 15))
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(4)
    sim.key(' ', false)
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(4)
  })

  it('пули летят вверх со скоростью bulletSpeed и пропадают за верхним краем', () => {
    const sim = shooting(engineWith(6, 9, 0))
    sim.tick(300)
    const ys = sim.peek<number[]>('bullets.map(function (b) { return b.y; })')
    expect(ys.length).toBeLessThan(60)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-20 - 9)
    sim.key(' ', false)
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('bulletSpeed 0 — пули копятся на месте', () => {
    const sim = shooting(engineWith(6, 0, 0))
    sim.tick(30)
    expect(n(sim, 'bullets.length')).toBe(30)
    expect(n(sim, 'bullets[29].y')).toBe(416)
  })

  it('пули рисуются цветом bulletColor', () => {
    const sim = shooting(engineWith(6, 9, 0).replace('"#ffd54a"', '"#ec407a"'))
    sim.tick(3)
    expect(sim.fills.filter((f) => f === '#ec407a')).toHaveLength(3)
  })
})

describe('Космос: волны пришельцев', () => {
  it('пришельцев нет — летит волна из waveSize лесенкой; сбили всех — следующая', () => {
    const sim = boot(fullGame(engineWith(6, 9, 15, 0)))
    sim.tick()
    expect(n(sim, 'wave')).toBe(1)
    expect(sim.peek('enemies.map(function (a) { return [a.x, a.y]; })')).toEqual([
      [20, 120],
      [90, 75],
      [160, 30],
      [230, -15],
      [300, -60],
    ])
    expect(sim.drawn.filter((t) => t === '👾')).toHaveLength(5)
    sim.peek('enemies = []')
    sim.tick()
    expect(n(sim, 'wave')).toBe(2)
    expect(n(sim, 'enemies.length')).toBe(5)
  })

  it('спускаются со скоростью enemySpeed; enemySpeed 0 — висят', () => {
    let sim = boot(fullGame(engineWith(6, 9, 15, 0)))
    sim.tick(60)
    expect(n(sim, 'enemies[0].y')).toBe(120)
    // первый кадр движок делает сам, при запуске: волна уже спустилась на 0.5
    sim = boot(fullGame())
    sim.tick(10)
    expect(n(sim, 'enemies[0].y')).toBe(125.5)
  })

  it('размер волны — waveSize', () => {
    const sim = boot(fullGame(engineWith().replace('var waveSize    = 5;', 'var waveSize    = 3;')))
    sim.tick()
    expect(n(sim, 'enemies.length')).toBe(3)
  })
})

describe('Космос: попадание', () => {
  /** Без стрельбы и без движения: ставим пули и пришельцев руками. */
  const still = () => boot(fullGame(engineWith(6, 0, 15, 0)))

  it('пуля внутри рамки пришельца — сбит: очко, пропадают и он, и пуля', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200 }, { x: 250, y: 200 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(sim.peek('enemies')).toEqual([{ x: 250, y: 200 }])
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('рядом с рамкой — мимо', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200 }]; bullets = [{ x: 135, y: 180 }, { x: 95, y: 180 }, { x: 110, y: 201 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(0)
    expect(n(sim, 'bullets.length')).toBe(3)
  })

  it('две пули в одного пришельца — одно очко, вторая пуля летит дальше (break)', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200 }]; bullets = [{ x: 110, y: 180 }, { x: 112, y: 185 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(n(sim, 'bullets.length')).toBe(1)
  })

  it('одна пуля в двух пришельцев — сбит только один', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200 }, { x: 104, y: 200 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(n(sim, 'enemies.length')).toBe(1)
  })

  it('пришелец долетел до корабля — минус жизнь, он пропадает', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 441 }, { x: 200, y: 300 }]')
    sim.tick()
    expect(n(sim, 'lives')).toBe(2)
    expect(sim.peek('enemies')).toEqual([{ x: 200, y: 300 }])
  })

  it('без стрельбы жизни уходят по одной и не в минус; потом всё стоит и «Игра окончена»', () => {
    const sim = boot(fullGame())
    const seen = [3]
    for (let i = 0; i < 4000; i++) {
      sim.tick()
      const lives = n(sim, 'lives')
      if (lives !== seen[seen.length - 1]) seen.push(lives)
    }
    expect(seen).toEqual([3, 2, 1, 0])
    expect(sim.drawn).toContain('Игра окончена')
    expect(sim.drawn).toContain('Жизни: 0')
    const frozen = JSON.stringify(sim.peek('[enemies, shipX, frame]'))
    sim.key('ArrowLeft', true)
    sim.key(' ', true)
    sim.tick(30)
    expect(JSON.stringify(sim.peek('[enemies, shipX, frame]'))).toBe(frozen)
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('стреляем, пролетая вдоль всей волны, — сбиваем всю волну', () => {
    const sim = boot(fullGame(engineWith(6, 9, 12)))
    sim.peek('shipX = 0')
    sim.key(' ', true)
    sim.key('ArrowRight', true)
    sim.tick(400)
    expect(n(sim, 'score')).toBe(5)
    expect(n(sim, 'wave')).toBe(2)
    expect(n(sim, 'lives')).toBe(3)
  })
})

describe('Космос: взрывы, «Волна за волной» и готовая версия', () => {
  it('сбил — на месте пришельца 💥 горит 20 кадров и гаснет', () => {
    const sim = boot(boomGame(engineWith(6, 0, 15, 0)))
    sim.peek('enemies = [{ x: 100, y: 200 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(sim.peek('booms')).toEqual([{ x: 100, y: 200, t: 19 }])
    expect(sim.drawn).toContain('💥')
    sim.tick(18)
    expect(sim.drawn).toContain('💥')
    sim.tick()
    expect(n(sim, 'booms.length')).toBe(0)
    sim.tick()
    expect(sim.drawn).not.toContain('💥')
  })

  it('каждая новая волна быстрее на 0.25, до maxSpeed', () => {
    // первая волна прилетает уже при запуске — с той скоростью, что в «Движке»
    const sim = boot(fastGame())
    expect(n(sim, 'wave')).toBe(1)
    expect(n(sim, 'enemySpeed')).toBe(0.5)
    const speeds: number[] = []
    for (let i = 0; i < 10; i++) {
      sim.peek('enemies = []')
      sim.tick()
      speeds.push(n(sim, 'enemySpeed'))
    }
    expect(n(sim, 'wave')).toBe(11)
    expect(speeds).toEqual([0.75, 1, 1.25, 1.5, 1.75, 2, 2, 2, 2, 2])
  })

  it('готовая версия: всё настроено, есть взрывы и ускорение; автопилот сбивает волну за волной', () => {
    const sim = boot(FINISHED_CODES)
    expect(sim.peek('[shipSpeed, bulletSpeed, reloadTime, enemySpeed, boomEmoji, maxSpeed]')).toEqual([
      6,
      9,
      12,
      0.5,
      '💥',
      2,
    ])
    sim.key(' ', true)
    // автопилот: корабль всё время под самым нижним пришельцем
    for (let i = 0; i < 3000; i++) {
      sim.peek(
        'if (enemies.length) { var low = enemies[0]; for (var q = 1; q < enemies.length; q++) if (enemies[q].y > low.y) low = enemies[q]; shipX = Math.max(0, Math.min(340, low.x)); }',
      )
      sim.tick()
    }
    expect(n(sim, 'score')).toBeGreaterThan(30)
    expect(n(sim, 'wave')).toBeGreaterThan(6)
    expect(n(sim, 'enemySpeed')).toBe(2)
  })
})
