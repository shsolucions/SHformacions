import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'robot-icon.png', 'SHbot.png', 'robot-full.png',
        'logo-word.png', 'logo-excel.png', 'logo-access.png',
        'logo-outlook.png', 'logo-actic.png', 'logo-powerpoint.png',
      ],
      manifest: {
        name: 'SHformacions',
        short_name: 'SHformacions',
        description: 'Formacio IT professional — SH Solucions',
        theme_color: '#0EA5E9',
        background_color: '#080808',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'robot-icon.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'robot-icon.png',
            sizes: '167x167',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'robot-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'robot-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'robot-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
})
