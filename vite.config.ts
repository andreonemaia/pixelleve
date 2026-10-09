import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { LIMITE_PRECACHE_BYTES, PADRAO_PRECACHE } from './src/pwa/precache.mjs'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-512-maskable.png'],
      manifest: {
        name: 'PixelLeve',
        short_name: 'PixelLeve',
        description: 'Imagens prontas para a web',
        lang: 'pt-BR',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F6F7F4',
        theme_color: '#147D64',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icones/icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: PADRAO_PRECACHE,
        maximumFileSizeToCacheInBytes: LIMITE_PRECACHE_BYTES,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        offlineGoogleAnalytics: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@jsquash/jpeg', '@jsquash/webp', '@jsquash/png', '@jsquash/oxipng'],
  },
  test: {
    environment: 'node',
    include: ['tests/unidade/**/*.test.ts'],
  },
})
