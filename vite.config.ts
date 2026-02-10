import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-progress', '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-alert-dialog'],
          'vendor-appwrite': ['appwrite'],
          'vendor-utils': ['lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge']
        },
        // Add hashing for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning threshold since we're code-splitting properly
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'appwrite',
      'sonner'
    ],
  },
  server: {
    fs: {
      strict: true,
    },
    cors: true,
    proxy: {
      // Proxy alle API-Routes zu Vercel Functions
      '^/api/.*': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy: any) => {
          // Fallback falls Vercel nicht läuft - bessere Error Messages
          proxy.on('error', (_err: any, _req: any, res: any) => {
            console.log('\n🚨 API Proxy Error: Vercel dev server nicht erreichbar auf Port 3001')
            console.log('💡 Tipp: Starte "vercel dev --port 3001" in einem separaten Terminal')
            if ('writeHead' in res) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ 
                error: 'API temporarily unavailable - Vercel dev server not running',
                hint: 'Run "vercel dev --port 3001" in a separate terminal'
              }))
            }
          })
        }
      }
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})