import { createRunner } from '@/core/runner.ts'
import runtime from './runtime.js?raw'

export const runner = createRunner(runtime)
