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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'favicon-32.png', 'favicon-16.png'],
      manifest: {
        name: 'Omix Store',
        short_name: 'Omix',
        description: 'The cleanest P2P marketplace in Kericho',
        theme_color: '#ff385c',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    }),
    copyPublicAssets()
  ]
})
