import { defineConfig } from 'tsup';
import packageJson from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  minify: true,
  format: ['cjs', 'esm'],
  target: 'node16',
  define: {
    'process.env.CLOUDKIT_VERSION': JSON.stringify(packageJson.version)
  }
});
