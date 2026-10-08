import { PICTURE_NAMES, pictureUrl, UNKNOWN_PICTURE } from '@/core/pictures.ts'
import { createRunner } from '@/core/runner.ts'
import runtime from './runtime.js?raw'

// Рисунки уходят в игру одной строкой данных перед обвязкой: у каждого — адрес SVG-картинки (data:).
const urls = Object.fromEntries([...PICTURE_NAMES, UNKNOWN_PICTURE].map((n) => [n, pictureUrl(n)]))
const pictures = `var __TB_PICS = ${JSON.stringify({ urls, unknown: UNKNOWN_PICTURE })};`

export const runner = createRunner(`${pictures}\n${runtime}`)
