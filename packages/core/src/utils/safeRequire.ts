import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { logger } from './logger';
export function safeRequire(filePath: string) {
  if (existsSync(filePath)) {
    try {
      return require(filePath);
    } catch (e) {
      logger.debug(e);
      if (e?.message?.includes(`Unexpected token 'export'`)) {
        let content = readFileSync(filePath, 'utf-8');
        if (content.startsWith('export default')) {
          content = content.replace('export default', 'module.exports =');
          writeFileSync(filePath, content);
          return require(filePath);
        }
      }
      if (e?.message?.includes('require() of ES Module')) {
        let content = readFileSync(filePath, 'utf-8');
        const cjs = filePath.replace('.js', '.cjs');
        console.log('Transforming wxcloud.config.js into CJS in module package');
        console.log(' --> writing', cjs);
        writeFileSync(cjs, content);
        return require(cjs);
      }
      return {};
    }
  }
  return {};
}
