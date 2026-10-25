import {defineConfig} from 'vite';
// Keep the worker at its original URL. Engine safety checks resolve relative
// to that directory; native SQLite remains external and is packaged normally.
export default defineConfig({
  ssr:{noExternal:true,external:['better-sqlite3']},
  build:{ssr:'src/adapters/sqlite/worker.ts',target:'node24',outDir:'dist/src/adapters/sqlite',emptyOutDir:false,minify:false,
    rolldownOptions:{output:{entryFileNames:'worker.js'}}},
});
