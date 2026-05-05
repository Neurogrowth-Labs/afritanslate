import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Note: this config intentionally does NOT define `process.env.GEMINI_API_KEY`
// or `process.env.API_KEY` for the client bundle. Inlining a server-side key
// via Vite's `define` would embed the literal value into every JS chunk and
// expose it to anyone who downloads the site. All Gemini calls must run
// inside Vercel API routes under /api/* where `process.env.GEMINI_API_KEY`
// is read at request time and never reaches the browser.
export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@components': path.resolve(__dirname, 'src/components'),
          '@services': path.resolve(__dirname, 'services'),
          '@src': path.resolve(__dirname, 'src'),
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
