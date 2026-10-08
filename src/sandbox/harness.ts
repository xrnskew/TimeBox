import { PALETTE, PICTURE_NAMES, pictureGrid, UNKNOWN_PICTURE } from '@/core/pictures.ts'
import { createRunner } from '@/core/runner.ts'
import runtime from './runtime.js?raw'

// Рисунки уходят в игру одной строкой данных перед обвязкой: обвязка рисует их на холсте по клеткам.
const grids = Object.fromEntries([...PICTURE_NAMES, UNKNOWN_PICTURE].map((n) => [n, pictureGrid(n).join('|')]))
const pictures = `var __TB_PICS = ${JSON.stringify({ palette: PALETTE, grids, unknown: UNKNOWN_PICTURE })};`

export const runner = createRunner(`${pictures}\n${runtime}`)
