import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' => relative asset paths, so the site works under
// https://<user>.github.io/<repo>/ with no extra base config.
export default defineConfig({
  base: './',
  plugins: [react()],
})
