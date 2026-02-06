import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Backend ke liye API proxy setup karein
    },
  },
  build: {
    outDir: 'build', // Build output directory
  },
});
