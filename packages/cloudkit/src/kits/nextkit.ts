import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';

export class NextKit extends Kit {
  static description = 'CloudKit for Next.js';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, 'package.json'));
    logger.debug('nextkit::detect', packageJson);
    return !!packageJson.dependencies.next;
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    // patch next.config.js
    const nextConfigPath = path.join(ctx.fullPath, 'next.config.js');
    const nextConfig = existsSync(nextConfigPath) ? require(nextConfigPath) : {};
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using NextKit.');
    }
    nextConfig.assetPrefix = ctx.staticDomain;
    if (existsSync(nextConfigPath)) {
      // backup old next.config.js
      writeFileSync(path.join(ctx.fullPath, 'next.config.js.bak'), readFileSync(nextConfigPath));
      console.log('patching next.config.js for CDN assets.');
      writeFileSync(nextConfigPath, `module.exports = ${JSON.stringify(nextConfig)}`);
    } else {
      writeFileSync(nextConfigPath, `module.exports = ${JSON.stringify(nextConfig)}`);
    }
    await new Promise<void>((res, rej) => {
      const child = spawn('npm', ['run', 'build'], {
        cwd: ctx.fullPath,
        stdio: 'inherit'
      });
      child.on('close', () => res());
      child.on('error', err => rej(err));
    });
    // restore user next.config.js
    if (existsSync(path.join(ctx.fullPath, 'next.config.js.bak'))) {
      writeFileSync(nextConfigPath, readFileSync(path.join(ctx.fullPath, 'next.config.js.bak')));
      unlinkSync(path.join(ctx.fullPath, 'next.config.js.bak'));
    } else {
      unlinkSync(path.join(ctx.fullPath, 'next.config.js'));
    }
    // execute runkit directly without detection
    const runKit = new RunKit();
    const runKitResult = await runKit.run(ctx, {
      fileGlob: ['package*.json', '.next/**/*', 'public/**/*'],
      providedFile: {
        Dockerfile: `FROM node:alpine
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npmmirror.com
ENV PORT 80
ENTRYPOINT [ "npm", "start" ]`
      }
    });
    return {
      ...runKitResult,
      staticTarget: {
        public: '',
        '.next/static': '_next/static/'
      }
    };
  }
}
