import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: '貓咪跑酷 Cat Dash', short_name: 'Cat Dash',
      theme_color: '#f6aa69', background_color: '#fff7e8',
      display: 'standalone', orientation: 'portrait', lang: 'zh-Hant',
      start_url: base, scope: base,
      icons: [{ src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' }, { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' }]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,svg,png}'],
      navigateFallback: undefined,
      runtimeCaching: [{
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: { cacheName: 'app-shell', networkTimeoutSeconds: 3, expiration: { maxEntries: 1 } }
      }]
    }
  })],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
