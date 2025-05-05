import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const config = {
  input: 'src/main.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript()
  ]
};

export default config;