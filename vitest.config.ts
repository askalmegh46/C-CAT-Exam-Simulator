// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react' // Keep this if you are testing React components

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // or 'node' depending on your test setup
    globals: true,
    setupFiles: './tests/setup.ts', // update this path if your setup file is elsewhere
  },
})
