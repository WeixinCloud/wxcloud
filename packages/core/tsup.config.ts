import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  clean: true,
  outDir: 'dist',
  dts: true,
  format: ['cjs'],
  target: 'node16',
  tsconfig: 'tsconfig.json'
});
