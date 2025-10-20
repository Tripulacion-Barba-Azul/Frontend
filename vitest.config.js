/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/*.config.js',
        '**/*.config.cjs',
        'dist/',
        'coverage/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/__tests__/**',
        '**/App.jsx',
        '**/main.jsx',
      ],
    },
  },
})
