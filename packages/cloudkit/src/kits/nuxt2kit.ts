import { spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { JSConfigASTHelper } from '../utils/astHelper/jsConfig';
import { isMatchMajorVersion, safeGetDepsFromPkgJSON } from '../utils/utils';
export class Nuxt2Kit extends Kit {
  static description = 'CloudKit for Nuxt.js';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    try {
      const packageJson = require(path.join(ctx.fullPath, 'package.json'));
      logger.debug('nuxt2kit::detect', packageJson);
      return (
        !!safeGetDepsFromPkgJSON(packageJson, 'nuxt') &&
        isMatchMajorVersion(safeGetDepsFromPkgJSON(packageJson, 'nuxt'), '2')
      );
    } catch (e) {
      return false;
    }
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    logger.debug('nuxtkit::runt', ctx);
    // patch nuxt.config.js
    const nuxtConfigPath = path.join(ctx.fullPath, 'nuxt.config.js');
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using nuxtKit.');
    }
    if (!ctx.port) {
      throw new Error('server port is required using nuxtKit.');
    }
    if (existsSync(nuxtConfigPath)) {
      // backup old nuxt.config.js
      const nuxtConfigSourceString = readFileSync(nuxtConfigPath, 'utf8');
      writeFileSync(path.join(ctx.fullPath, 'nuxt.config.js.bak'), nuxtConfigSourceString);
      const helper = new JSConfigASTHelper(nuxtConfigSourceString);
      if (helper.getValue<string>('target') === 'static') {
        throw Error(`[ERROR] please change wxcloud.config['type'] with static`);
      }
      const nuxtConfigString = helper.setValue('build.publicPath', ctx.staticDomain).toSource();
      writeFileSync(nuxtConfigPath, nuxtConfigString);
      logger.debug('nuxt patched config', nuxtConfigSourceString);
    } else {
      const nuxtConfig = {
        build: {
          publicPath: ctx.staticDomain
        }
      };
      writeFileSync(nuxtConfigPath, `export default ${JSON.stringify(nuxtConfig)}`);
    }
    console.log('patching nuxt.config.js for CDN assets.');
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
RUN npm i --registry=https://registry.npmmirror.com
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=${ctx.port}
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
