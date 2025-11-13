import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configurações de assets estáticos
  publicDir: 'public',
  assetsInclude: ['**/*.pdf'],
  
  // Configurações de desenvolvimento
  server: {
    port: Number(process.env.PORT || process.env.VITE_DEV_PORT || 5121),
    strictPort: true,
    host: true,
    open: true,
    cors: {
      origin: [
        'http://localhost:5121',
        'http://localhost:5122',
        'http://localhost:5123',
        'http://localhost:5124',
        'http://127.0.0.1:5121',
        'http://127.0.0.1:5122',
        'http://127.0.0.1:5123',
        'http://127.0.0.1:5124',
        'https://direitaai.com',
        'https://www.direitaai.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5120',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:5120',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Configurações de preview
  preview: {
    port: 4173,
    host: true,
    cors: {
      origin: [
        'http://localhost:5121',
        'http://localhost:5122',
        'http://localhost:5123',
        'http://localhost:5124',
        'http://127.0.0.1:5121',
        'http://127.0.0.1:5122',
        'http://127.0.0.1:5123',
        'http://127.0.0.1:5124',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'https://direitaai.com',
        'https://www.direitaai.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    },
  },
  
  // Configurações de build otimizadas para performance
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
    target: 'es2020',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          // Routing
          'router': ['react-router-dom'],
          // HTTP Client
          'http-client': ['axios'],
          // UI Components
          'ui-components': ['@headlessui/react', '@heroicons/react/24/outline', '@heroicons/react/24/solid'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // Maps (large dependency)
          'maps': ['mapbox-gl'],
          // Utils
          'utils': ['date-fns', 'clsx'],
        },
        // Otimizar nomes de arquivos
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Configurações de minificação
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
      },
    },
  },

  // Removido define global para evitar conflitos com Supabase
  // define: {
  //   global: 'globalThis',
  // },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  
  // Configurações de resolução
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  
  // Configurações de CSS
  css: {
    devSourcemap: true,
  },
  
  // Configurações de otimização de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      '@supabase/supabase-js',
      'axios',
      'date-fns',
      'clsx',
      'mapbox-gl',
      'react-map-gl',
    ],
    // Não excluir mapbox-gl; precisamos que o Vite o pré-compile
  },
  

});