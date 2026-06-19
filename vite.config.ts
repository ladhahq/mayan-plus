import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'conch-shim': 'src/conch-shim.ts',
        'fix-aspect-ratio': 'src/fix-aspect-ratio.ts',
      },
      output: {
        // Output classic scripts to root (not assets/) so the
        // <script src="..."> tags in index.html resolve correctly.
        entryFileNames: (chunk) => {
          if (chunk.name === 'conch-shim' || chunk.name === 'fix-aspect-ratio') {
            return 'src/[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
