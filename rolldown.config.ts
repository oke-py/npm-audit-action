// See: https://rolldown.rs/guide/

import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  // The action runs on the Node.js runtime declared in action.yml.
  platform: 'node',
  resolve: {
    // Sources use NodeNext-style specifiers (`./main.js`) that resolve to the
    // `.ts` file on disk.
    extensionAlias: { '.js': ['.ts', '.js'] }
  },
  output: {
    file: 'dist/index.js',
    format: 'esm',
    sourcemap: true
  }
})
