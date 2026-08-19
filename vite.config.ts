import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor';
          if (id.includes('node_modules/@tanstack/react-query')) return 'query';
          if (id.includes('node_modules/i18next')) return 'i18n';
          if (id.includes('node_modules/axios')) return 'http';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/zustand')) return 'state';
        },
      },
    },
  },
})
