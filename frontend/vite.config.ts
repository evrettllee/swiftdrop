import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const DEFAULT_API_TARGET = 'http://localhost:8080';

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.VITE_USER_NODE_ENV ??= '';
  }

  return {
    plugins: [react(), tailwindcss()],
    // The FSD layers; the same aliases are in the paths of tsconfig.app.json.
    resolve: {
      alias: {
        '@/app': fileURLToPath(new URL('./src/app', import.meta.url)),
        '@/pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@/features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@/entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
        '@/shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      },
    },
    // One .env for the whole repository: the client gets only the variables that start with VITE_.
    envDir: '..',
    server: {
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET ?? DEFAULT_API_TARGET,
          changeOrigin: true,
          // The socket of the courier cabinet (/api/socket.io) goes through the same proxy.
          ws: true,
        },
      },
    },
  };
});
