import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative URLs: the build also runs from itch.io's sub-folder iframe.
  base: './',
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/public/assets/models/**/*.glb'],
    },
  },
  build: {
    // three.js core alone is ~710 kB minified; every other chunk stays well below this.
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        // Stable vendor chunks: game patches no longer invalidate the cached engine.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three[\\/](fiber|drei)|three-stdlib|zustand)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts'],
  },
})
