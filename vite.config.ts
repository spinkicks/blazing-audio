import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Split big, rarely-changing vendor code so it caches separately and
        // downloads in parallel (keeps the app chunk small and first paint fast).
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          react: ['react', 'react-dom', 'react-router-dom'],
          gsap: ['gsap'],
        },
      },
    },
  },
});
