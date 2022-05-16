import { existsSync, readFileSync, writeFileSync } from 'node:fs';
export function safeRequire(filePath: string) {
  if (existsSync(filePath)) {
    try {
      return require(filePath);
    } catch (e) {
      console.error(e.message);
      if (e?.message?.includes(`Unexpected token 'export'`)) {
        let content = readFileSync(filePath, 'utf-8');
        if (content.startsWith('export default')) {
          content = content.replace('export default', 'module.exports =');
          writeFileSync(filePath, content);
          return require(filePath);
        }
      }
      return {};
    }
  }
  return {};
}
