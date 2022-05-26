import { defineConfig } from 'tsup';
import packageJson from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  dts: true,
  minify: true,
  format: ['cjs', 'esm'],
  target: 'node12',
  define: {
    'process.env.CLOUDKIT_VERSION': JSON.stringify(packageJson.version)
  },
  noExternal: ['jscodeshift', 'recast']
});
