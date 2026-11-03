import { defineConfig } from 'vite';

// Security: Server binds strictly to 127.0.0.1 (localhost) and never 0.0.0.0.
// Sets anti-clickjacking, nosniff, and feature-policy headers.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cache-Control': 'no-store'
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
});
