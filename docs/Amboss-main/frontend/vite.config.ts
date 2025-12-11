import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: replace "Amboss" if your repo name changes
  base: '/',
  plugins: [react()],
})
