import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import fs from 'fs'

// Copy public assets to dist after build
function copyPublicAssets() {
  return {
    name: 'copy-public-assets',
    closeBundle() {
      const publicDir = resolve(__dirname, 'public')
      const distDir = resolve(__dirname, 'dist')
      if (!fs.existsSync(publicDir)) return
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
      fs.readdirSync(publicDir).forEach(item => {
        const src = resolve(publicDir, item)
        const dest = resolve(distDir, item)
        try {
          const stat = fs.statSync(src)
          if (stat.isDirectory()) {
            fs.cpSync(src, dest, { recursive: true })
          } else {
            fs.copyFileSync(src, dest)
          }
        } catch (e) {
          // Skip files that can't be read/copied
          console.warn(`Skipping ${item}: ${e.message}`)
        }
      })
    }
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    copyPublicAssets()
  ],
  resolve: {
    alias: {
      // Use browser native WebSocket instead of Node.js ws package
      'ws': resolve(__dirname, 'src/utils/browser-ws.js'),
    },
  },
  define: {
    // Ensure Supabase Realtime uses browser WebSocket
    'process.env': {},
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
})
