import path from 'path';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { safeGetDepsFromPkgJSON } from '../utils/utils';
import { spawn } from 'child_process';
import { Dockerpacks, HardCodedPromptIO } from '@wxcloud/dockerpacks';

export class NextKit extends Kit {
  static description = 'CloudKit for Next.js';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, 'package.json'));
    logger.debug('nextkit::detect', packageJson);
    return !!safeGetDepsFromPkgJSON(packageJson, 'next');
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    // patch next.config.js
    const nextConfigPath = path.join(ctx.fullPath, 'next.config.js');
    const nextConfig = existsSync(nextConfigPath) ? require(nextConfigPath) : {};
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using NextKit.');
    }
    if (!ctx.port) {
      throw new Error('server port is required using nuxtKit.');
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

    // build Dockerfile and related files
    const dockerpacks = new Dockerpacks();
    const detectionResult = await dockerpacks.detectWithGroup(
      'node.npm',
      ctx.fullPath,
      new HardCodedPromptIO({
        environments: [`PORT=${ctx.port}`],
        generalEntrypoint: 'npm start',
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
      fileGlob: ['package*.json', '.next/**/*', 'public/**/*'],
      providedFile: {
        Dockerfile: buildResult.dockerfile,
        ...Object.fromEntries(buildResult.files.entries())
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
