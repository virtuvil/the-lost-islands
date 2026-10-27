import {defineConfig} from 'vite';
export default defineConfig({optimizeDeps:{exclude:['three']},build:{chunkSizeWarningLimit:750}});
