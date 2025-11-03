import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa' // Disabled for Telegram Mini Apps
import path from 'path'
import fs from 'fs'

/**
 * Plugin to copy polyfills.js to dist folder
 * Alternative to vite-plugin-static-copy for ESM compatibility
 */
function copyPolyfillsPlugin(): Plugin {
  return {
    name: 'copy-polyfills',
    closeBundle() {
      const src = path.resolve(__dirname, 'public/polyfills.js')
      const dest = path.resolve(__dirname, 'dist/polyfills.js')

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log('[Vite] Copied polyfills.js to dist/')
      } else {
        console.warn('[Vite] Warning: polyfills.js not found in public/')
      }
    }
  }
}

/**
 * Plugin to ensure polyfills are loaded first for deployment
 * This is critical for Telegram Mini App environment
 */
function injectPolyfillPlugin(basePath: string): Plugin {
  const polyfillPath = `${basePath}polyfills.js`.replace('//', '/')

  return {
    name: 'inject-polyfill-first',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        // Ensure polyfill script is the very first script in <head>
        // This prevents "Cannot destructure 'Request' of undefined" errors
        // in Telegram's WebView
        if (!html.includes(`src="${polyfillPath}"`)) {
          html = html.replace(
            '<head>',
            `<head>\n    <!-- CRITICAL: Polyfill injected by Vite -->\n    <script src="${polyfillPath}"></script>`
          );
        }
        return html;
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Use /webapp for Render, / for Cloudflare Pages
  base: process.env.CF_PAGES ? '/' : '/webapp',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    copyPolyfillsPlugin(),
    injectPolyfillPlugin(process.env.CF_PAGES ? '/' : '/webapp/'),
    react(),
    // PWA disabled for Telegram Mini Apps - service workers can interfere with Telegram's iframe
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   injectRegister: false,
    //   devOptions: {
    //     enabled: false,
    //   },
    //   workbox: {
    //     clientsClaim: true,
    //     skipWaiting: true,
    //     cleanupOutdatedCaches: true,
    //   },
    //   manifest: {
    //     name: 'Pirates Expedition Mini App',
    //     short_name: 'Pirates Expedition',
    //     description: 'Telegram Mini App for Pirates Expedition Management',
    //     theme_color: '#8B4513',
    //     background_color: '#F5DEB3',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/webapp/',
    //     start_url: '/webapp/',
    //     icons: [
    //       {
    //         src: '/webapp/pirate-icon-192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/webapp/pirate-icon-512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['socket.io-client'],
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['styled-components', 'framer-motion'],
          'charts': ['recharts'],
          'telegram': ['@telegram-apps/sdk'],
          'websocket': ['socket.io-client']
        },
        // Add globals to prevent undefined destructuring
        globals: {
          Request: 'Request',
          Response: 'Response'
        }
      }
    },
    // Target modern browsers that support Fetch API
    target: 'esnext',
    // Polyfill node globals
    modulePreload: {
      polyfill: true
    }
  }
})