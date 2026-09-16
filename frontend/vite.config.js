// Vite is the build tool/dev server for this frontend (fast local dev
// server + bundles everything into static files for production via
// `npm run build`). This file configures which plugins Vite uses.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Lets Vite understand JSX/React components and enables React Fast
    // Refresh (component state survives hot-reload edits during dev).
    react(),
    // Tailwind v4's own Vite plugin - reads @theme/utility classes directly
    // from CSS (see frontend/src/index.css) with no separate PostCSS config
    // file needed.
    tailwindcss(),
    // Writes dist/stats.html on every build (gitignored) - open it to see
    // a treemap of what's actually in each JS chunk. Doesn't affect the
    // served app; it's a report generated alongside the build output.
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
