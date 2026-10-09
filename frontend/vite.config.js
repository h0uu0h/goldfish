import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: { rollupOptions: { input: { desktop: fileURLToPath(new URL('./index.html', import.meta.url)), author: fileURLToPath(new URL('./about/index.html', import.meta.url)) } } },
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})
