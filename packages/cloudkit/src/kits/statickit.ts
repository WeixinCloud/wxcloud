import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';

export class StaticKit extends Kit {
  static description = 'CloudKit for Static Sites';
  static type = KitType.STATIC;

  private _detectedScript = 'build';
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, 'package.json'));
    logger.debug('statickit::detect', packageJson);
    // looking for react-scripts(cra), vue-cli(@vue/cli-service) and `generate` or `build` scripts.
    if (packageJson.dependencies?.['react-scripts']) {
      return true;
    }
    if (packageJson.devDependencies?.['@vue/cli-service']) {
      return true;
    }
    if (packageJson.scripts?.generate) {
      this._detectedScript = 'generate';
      return true;
    }
    if (packageJson.scripts?.build) {
      this._detectedScript = 'build';
      // if build script is next build, check if there is an export
      if (packageJson.scripts.build === 'next build') {
        console.log(
          '[ERROR] detected next build without export, you should add `next export` to your build script for static deployment.'
        );
        throw new Error('next build without export');
      }
      return true;
    }
    return false;
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    await new Promise<void>((res, rej) => {
      const child = spawn('npm', ['run', this._detectedScript], {
        cwd: ctx.fullPath,
        stdio: 'inherit'
      });
      child.on('close', () => res());
      child.on('error', err => rej(err));
    });
    // try to find the build output
    const purposedPathEnds = ['build', 'out', 'dist'];
    const targets: Record<string, string> = {};
    // check each path
    for (const pathEnd of purposedPathEnds) {
      const buildPath = path.join(ctx.fullPath, pathEnd);
      if (existsSync(buildPath)) {
        targets[pathEnd] = '';
      }
    }

    return {
      staticTarget: targets
    };
  }
}
