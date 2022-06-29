import path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import parse from 'gitignore-globs';

export function getDockerIgnore(cwd: string) {
  const dockerIgnore = path.join(cwd, '.dockerignore');
  let fileToIgnore: string[] = [];
  if (fs.existsSync(dockerIgnore)) {
    console.log(chalk.blue(`读取到 .dockerignore, 将忽略其中的文件`));
    fileToIgnore = parse(dockerIgnore);
    // keep dockerfile since we need that to deploy
    fileToIgnore = fileToIgnore.filter(f => !f.includes('Dockerfile'));
  }
  console.log(fileToIgnore);
  return fileToIgnore;
}
