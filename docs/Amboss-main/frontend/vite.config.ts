import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: replace "Amboss_web" if your repo name changes
  base: '/Amboss_web/',
  plugins: [react()],
})
