import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'jsdom',
                'canvas',
                'mammoth',
                'pdf-parse',
                'pdfmake',
                'pdfmake/build/pdfmake',
                'pdfmake/build/vfs_fonts',
                'docx',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    electronRenderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@engine': path.resolve(__dirname, 'src/engines'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
});
