import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { crossPlatformNpm, isMatchMajorVersion, safeGetDepsFromPkgJSON } from '../utils/utils';
import { Dockerpacks, HardCodedPromptIO } from '@wxcloud/dockerpacks';
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
    if (!ctx.port) {
      throw new Error('server port is required using nuxtKit.');
    }
    await new Promise<void>((res, rej) => {
      const child = spawn(crossPlatformNpm, ['run', 'build'], {
        cwd: ctx.fullPath,
        stdio: 'inherit'
      });
      child.on('close', () => res());
      child.on('error', err => rej(err));
    });
    // build Dockerfile and related files
    const dockerpacks = new Dockerpacks();
    const detectionResult = await dockerpacks.detectWithGroup(
      'node.npm',
      ctx.fullPath,
      new HardCodedPromptIO({
        // nuxt3 just use env is OK
        environments: [`HOST=0.0.0.0`, `PORT=${ctx.port}`, `NUXT_APP_CDN_URL=${ctx.staticDomain}`],
        generalEntrypoint: 'node .output/server/index.mjs',
        expose: `${ctx.port}`
      })
    );
    if (!detectionResult) {
      throw new Error('failed to detect project via Dockerpacks');
    }
    const buildResult = await detectionResult.build();

    // execute runkit directly without detection
    const runKit = new RunKit();
    const runKitResult = await runKit.run(ctx, {
      fileGlob: ['package*.json', '.output/**/*', 'public/**/*', nuxtConfigPath],
      providedFile: {
        Dockerfile: buildResult.dockerfile,
        ...Object.fromEntries(buildResult.files.entries())
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
