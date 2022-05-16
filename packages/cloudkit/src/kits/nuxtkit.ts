import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { safeRequire } from '../utils/safeRequire';

export class NuxtKit extends Kit {
  static description = 'CloudKit for Nuxt.js';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, 'package.json'));
    logger.debug('nuxtkit::detect', packageJson);
    return !!packageJson.dependencies.nuxt;
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    logger.debug('nuxtkit::runt', ctx);
    // patch nuxt.config.js
    const nuxtConfigPath = path.join(ctx.fullPath, 'nuxt.config.js');
    const nuxtConfig = safeRequire(nuxtConfigPath);
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using nuxtKit.');
    }
    nuxtConfig.build = {
      ...(nuxtConfig.build || {}),
      publicPath: ctx.staticDomain
    };
    if (existsSync(nuxtConfigPath)) {
      // backup old nuxt.config.js
      writeFileSync(path.join(ctx.fullPath, 'nuxt.config.js.bak'), readFileSync(nuxtConfigPath));
      console.log('patching nuxt.config.js for CDN assets.');
    }
    writeFileSync(nuxtConfigPath, `export default ${JSON.stringify(nuxtConfig)}`);
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
      fileGlob: ['package*.json', '.nuxt/**/*', 'static/**/*', 'nuxt.config.js'],
      providedFile: {
        Dockerfile: `FROM node
COPY . /app
WORKDIR /app
RUN npm i --registry https://mirrors.cloud.tencent.com/npm/
ENV NUXT_HOST=0.0.0.0
ENTRYPOINT [ "npm", "start" ]`
      }
    });
    // NUXT will use config in production mode. So we should restore user nuxt.config.js here
    // restore user nuxt.config.js
    if (existsSync(path.join(ctx.fullPath, 'nuxt.config.js.bak'))) {
      writeFileSync(nuxtConfigPath, readFileSync(path.join(ctx.fullPath, 'nuxt.config.js.bak')));
      unlinkSync(path.join(ctx.fullPath, 'nuxt.config.js.bak'));
    } else {
      unlinkSync(path.join(ctx.fullPath, 'nuxt.config.js'));
    }
    return {
      ...runKitResult,
      staticTarget: {
        static: '',
        '.nuxt/dist/client': ''
      }
    };
  }
}
