import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // /api ile başlayan tüm istekleri Moodle sunucusuna yönlendir
      '/api': {
        target: 'https://moodle.argeyazilim.tr',
        changeOrigin: true,
        secure: false, // SSL sertifika hatalarını göz ardı et
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})