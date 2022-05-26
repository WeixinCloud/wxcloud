import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { isMatchMajorVersion, safeGetDepsFromPkgJSON } from '../utils/utils';
export class Nuxt3Kit extends Kit {
  static description = 'CloudKit for Nuxt.js v3';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    try {
      const packageJson = require(path.join(ctx.fullPath, 'package.json'));
      logger.debug('nuxt3kit::detect', packageJson);
      return (
        !!safeGetDepsFromPkgJSON(packageJson, 'nuxt') &&
        isMatchMajorVersion(safeGetDepsFromPkgJSON(packageJson, 'nuxt'), '3')
      );
    } catch (e) {
      return false;
    }
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    logger.debug('nuxt3kit::runt', ctx);
    // patch nuxt.config.js
    let nuxtConfigPath = '';
    ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs'].some(item => {
      const currentPath = path.join(ctx.fullPath, item);
      if (existsSync(currentPath)) {
        nuxtConfigPath = currentPath;
        return true;
      }
      return false;
    });
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using nuxtKit.');
    }
    await new Promise<void>((res, rej) => {
      const child = spawn('npm', ['run', 'build'], {
        cwd: ctx.fullPath,
        stdio: 'inherit'
      });
      child.on('close', () => res());
      child.on('error', err => rej(err));
    });
    // execute runkit directly without detection
    const runKit = new RunKit();
    const runKitResult = await runKit.run(ctx, {
      fileGlob: ['package*.json', '.output/**/*', 'public/**/*', nuxtConfigPath],
      providedFile: {
        // nuxt3 just use env is OK
        Dockerfile: `FROM node
COPY . /app
WORKDIR /app
RUN npm i --registry=https://registry.npmmirror.com
ENV NUXT_APP_CDN_URL=${ctx.staticDomain}
ENTRYPOINT [ "npm", "run", "preview" ]`
      }
    });
    return {
      ...runKitResult,
      staticTarget: {
        '.output/public/_nuxt': '_nuxt/',
        '.output/public': ''
      }
    };
  }
}
