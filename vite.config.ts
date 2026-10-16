import { defineConfig } from 'vite';
export default defineConfig({root:'src/ui',base:'./',build:{outDir:'../../dist/renderer',emptyOutDir:true,target:'es2023'}});
