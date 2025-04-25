import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/multiplayer-demo/', // Set the base path for GitHub Pages deployment
  build: {
    outDir: 'docs', // Set output directory to 'docs' for GitHub Pages
  },
})
