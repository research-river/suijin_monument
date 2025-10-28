import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index_gsi.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
