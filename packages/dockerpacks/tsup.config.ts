import { defineConfig } from 'tsup';
import { version } from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  dts: true,
  format: ['cjs'],
  target: 'node12',
  define: {
    'process.env.DOCKERPACKS_VERSION': JSON.stringify(version)
  }
});
