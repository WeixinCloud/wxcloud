import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  clean: true,
  outDir: 'dist',
  dts: true,
  format: ['cjs', 'esm'],
  target: 'node12',
  tsconfig: 'tsconfig.json'
});
