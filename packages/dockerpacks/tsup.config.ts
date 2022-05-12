import { defineConfig } from 'tsup';
import { version } from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['cjs'],
  target: 'node16',
  define: {
    'process.env.DOCKERPACKS_VERSION': JSON.stringify(version)
  }
});
