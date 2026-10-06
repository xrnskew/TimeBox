/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// Сборка — один dist/index.html со всем внутри (JS, CSS, шрифты):
// его можно открыть с флешки без интернета.
export default defineConfig({
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
})
