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

// HTML env var replacement for GA
function htmlGAInject() {
  return {
    name: 'html-ga-inject',
    transformIndexHtml(html) {
      const gaId = process.env.VITE_GA_MEASUREMENT_ID;
      if (!gaId) {
        // Remove GA snippet entirely if no ID configured
        return html.replace(
          /<!-- Google Analytics \(gtag\.js\) -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>\n?/,
          ''
        );
      }
      return html.replace(/%VITE_GA_MEASUREMENT_ID%/g, gaId);
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    htmlGAInject(),
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
      output: {
        manualChunks: {
          // Vendor chunk — React, React Router, and Supabase core
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Admin chunk — all admin pages grouped together
          admin: [
            resolve(__dirname, 'src/pages/AdminLayout.jsx'),
            resolve(__dirname, 'src/pages/AdminOverview.jsx'),
            resolve(__dirname, 'src/pages/AdminProducts.jsx'),
            resolve(__dirname, 'src/pages/AdminOrders.jsx'),
            resolve(__dirname, 'src/pages/AdminCustomers.jsx'),
            resolve(__dirname, 'src/pages/AdminAnalytics.jsx'),
            resolve(__dirname, 'src/pages/AdminPromoCodes.jsx'),
            resolve(__dirname, 'src/pages/AdminSettings.jsx'),
            resolve(__dirname, 'src/pages/AdminNotifications.jsx'),
            resolve(__dirname, 'src/pages/AdminAffiliates.jsx'),
          ],
          // Help Center chunk
          help: [
            resolve(__dirname, 'src/pages/help/HelpCenter.jsx'),
            resolve(__dirname, 'src/pages/help/ShoppingGuide.jsx'),
            resolve(__dirname, 'src/pages/help/Refund.jsx'),
            resolve(__dirname, 'src/pages/help/DisputeResolution.jsx'),
            resolve(__dirname, 'src/pages/help/AfterSale.jsx'),
            resolve(__dirname, 'src/pages/help/Delivery.jsx'),
            resolve(__dirname, 'src/pages/help/FAQ.jsx'),
            resolve(__dirname, 'src/pages/help/Payment.jsx'),
            resolve(__dirname, 'src/pages/help/DeliveryTime.jsx'),
            resolve(__dirname, 'src/pages/help/FlashSale.jsx'),
          ],
        },
      },
    },
  },
})
