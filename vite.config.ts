import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    target: 'ES2020',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('node_modules/firebase')) return 'firebase-vendor';
          if (id.includes('node_modules/lucide')) return 'icons';
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';
          
          // Page chunks for code splitting
          if (id.includes('/pages/Admin')) return 'admin-page';
          if (id.includes('/pages/SuperAdmin')) return 'superadmin-page';
          if (id.includes('/pages/Checkout')) return 'checkout-page';
          if (id.includes('/pages/Shop')) return 'shop-page';
          
          // Component chunks
          if (id.includes('/components/')) return 'components';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/database', 'lucide-react'],
    esbuildOptions: {
      supported: {
        bigint: true,
        'top-level-await': true,
      },
    },
  },
  server: {
    hmr: true,
  },
});
