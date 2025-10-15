// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bryangan.com',
  vite: {
    server: {
      host: true,
      allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
    },
    resolve: {
      alias: import.meta.env.PROD
        ? {
            'react-dom/server': 'react-dom/server.edge',
          }
        : {},
    },
  },
  integrations: [
    react(),
    tailwind(),
    sitemap()
  ],
  output: 'server',
  adapter: cloudflare(),
});