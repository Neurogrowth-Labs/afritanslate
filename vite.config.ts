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
        // Force `@google/genai` to resolve to its explicit web entry point
        // (`@google/genai/web`) for the browser bundle. The default `.`
        // export has a `node` condition that pulls in `google-auth-library`
        // -> `gaxios` -> `node-fetch`, which in turn imports `node:http`,
        // `node:util.promisify`, etc. — Vercel's rollup build then fails
        // with `"promisify" is not exported by "__vite-browser-external"`.
        // The `web` subpath is the package's documented browser bundle and
        // has zero Node built-in imports.
        alias: {
          '@google/genai': '@google/genai/web',
          '@components': path.resolve(__dirname, 'src/components'),
          '@services': path.resolve(__dirname, 'services'),
          '@src': path.resolve(__dirname, 'src'),
          '@': path.resolve(__dirname, '.'),
        },
        // Explicitly prefer the browser condition first so we never
        // accidentally resolve to a package's Node entry in the client
        // bundle, regardless of Vite version. (Vite 6.4.1 had a subtle
        // exports-resolution behavior that pulled in `node-fetch` on
        // Vercel even though the local 6.4.2 build was clean.)
        conditions: ['browser', 'module', 'import', 'default'],
      }
    };
});
