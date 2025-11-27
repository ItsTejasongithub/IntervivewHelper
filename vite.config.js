import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: './', // Important for Electron to load assets correctly
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add API key to the proxied request
              const apiKey = env.VITE_ANTHROPIC_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey);
              }
            });
          }
        }
      }
    }
  }
})
