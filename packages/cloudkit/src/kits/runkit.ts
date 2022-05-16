import { Kit, KitType, IKitContext, IKitDeployTarget } from '../common/kit';
import archiver from 'archiver';
import { createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';

export interface IRunKitOptions {
  /**
   * RunKit file filter
   */
  fileGlob?: string[];
  providedFile?: Record<string, string>;
}

export class RunKit extends Kit {
  static type = KitType.RUN;
  static description = 'RunKit';
  async run(ctx: IKitContext, options?: IRunKitOptions): Promise<IKitDeployTarget> {
    // determine which file to be packed
    const zipName = `.temp-runkit-${Date.now()}.zip`;
    const archive = archiver('zip');
    const output = createWriteStream(path.join(ctx.fullPath, zipName));
    if (options?.fileGlob) {
      options?.fileGlob?.forEach(fg => archive.glob(fg, { cwd: ctx.fullPath }));
    } else {
      archive.glob(
        '**/*',
        {
          cwd: ctx.fullPath,
          dot: false
        },
        {}
      );
    }
    // add provided file
    if (options?.providedFile) {
      Object.keys(options.providedFile).forEach(key => {
        archive.append(options.providedFile![key], { name: key });
      });
    }
    archive.pipe(output);
    ctx.lifecycleHooks?.enterStage('packing runkit');
    await new Promise<void>((resolve, reject) => {
      archive.on('error', err => reject(err));
      archive.on('end', () => resolve());
      archive.finalize();
    });
    ctx.lifecycleHooks?.leaveStage('packing runkit');
    return {
      runTarget: zipName
    };
  }
  async detect(ctx: IKitContext) {
    return existsSync(path.join(ctx.fullPath, 'Dockerfile'));
  }
}
