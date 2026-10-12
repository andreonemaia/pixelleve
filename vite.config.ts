import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { LIMITE_PRECACHE_BYTES, PADRAO_PRECACHE } from './src/pwa/precache.mjs'

const registroVazio = fileURLToPath(new URL('./src/pwa/registroVazio.ts', import.meta.url))

export default defineConfig(() => {
  const desktop = Boolean(process.env.TAURI_ENV_PLATFORM)
  return {
    clearScreen: false,
    plugins: [
      react(),
      ...(desktop
        ? []
        : [
            VitePWA({
              registerType: 'prompt' as const,
              injectRegister: false as const,
              includeAssets: ['icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-512-maskable.png'],
              manifest: {
                name: 'PixelLeve',
                short_name: 'PixelLeve',
                description: 'Imagens prontas para a web',
                lang: 'pt-BR',
                id: '/',
                start_url: '/',
                scope: '/',
                display: 'standalone' as const,
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
          ]),
    ],
    resolve: desktop
      ? {
          alias: {
            'virtual:pwa-register/react': registroVazio,
          },
        }
      : undefined,
    server: desktop
      ? {
          port: 1420,
          strictPort: true,
          host: false,
          watch: {
            ignored: ['**/src-tauri/**'],
          },
        }
      : undefined,
    build: {
      outDir: desktop ? 'dist-desktop' : 'dist',
      emptyOutDir: true,
    },
    worker: {
      format: 'es' as const,
    },
    optimizeDeps: {
      exclude: ['@jsquash/jpeg', '@jsquash/webp', '@jsquash/png', '@jsquash/oxipng'],
    },
    test: {
      environment: 'node' as const,
      include: ['tests/unidade/**/*.test.ts'],
    },
  }
})
