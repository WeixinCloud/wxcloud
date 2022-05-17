import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { IKitContext, IKitDeployTarget, Kit, KitType } from '../common/kit';
import { logger } from '../utils/debug';
import { RunKit } from './runkit';
import { safeRequire } from '../utils/safeRequire';
import j from 'jscodeshift';
import { namedTypes } from 'ast-types';
export class NuxtKit extends Kit {
  static description = 'CloudKit for Nuxt.js';
  static type = KitType.UNIVERSAL;
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, 'package.json'));
    logger.debug('nuxtkit::detect', packageJson);
    return !!packageJson.dependencies.nuxt;
  }
  // add build options to nuxt config
  transformConfig(sourceCode: string, ctx: IKitContext): string {
    // use https://astexplorer.net/ for debug
    const buildProperty = j(sourceCode).find(j.Property, {
      key: {
        name: 'build'
      }
    });
    // if build option is already in config
    if (buildProperty.length !== 0) {
      buildProperty.forEach(p => {
        const properties = (p?.node?.value as j.ObjectExpression)?.properties;
        const publicPathNode = properties?.find(
          item => item.type === 'Property' && (item?.key as j.Identifier)?.name === 'publicPath'
        ) as namedTypes.Property;

        // if already has publicPath, we need to change it
        if (publicPathNode) {
          (publicPathNode?.value as j.Literal).value = ctx.staticDomain!;
        } else {
          // else add publicPath
          const item = j.property('init', j.identifier('publicPath'), j.literal(ctx.staticDomain!));
          properties.push(item);
        }
      });
      return buildProperty.toSource();
    } else {
      const root = j(sourceCode).find(j.ExportDefaultDeclaration);
      const obj = j.property(
        'init',
        j.identifier('build'),
        j.objectExpression([
          j.property('init', j.identifier('publicPath'), j.literal(ctx.staticDomain!))
        ])
      );
      // es6 export default
      if (root.length > 0) {
        root.forEach(item => {
          // add build props:
          // build: {
          //   publicPath: 'xxx'
          // }
          (item?.node?.declaration as j.ObjectExpression)?.properties.push(obj);
        });
        return root.toSource();
      } else {
        // module.exports
        const root = j(sourceCode).find(j.AssignmentExpression)?.at(0);
        if (root.length > 0) {
          root.forEach(item => {
            (item.node.right as j.ObjectExpression)?.properties?.push(obj);
          });
        }
        return root.toSource();
      }
    }
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    logger.debug('nuxtkit::runt', ctx);
    // patch nuxt.config.js
    const nuxtConfigPath = path.join(ctx.fullPath, 'nuxt.config.js');
    if (!ctx.staticDomain) {
      throw new Error('static domain is required using nuxtKit.');
    }
    if (existsSync(nuxtConfigPath)) {
      // backup old nuxt.config.js
      const nuxtConfigSourceString = readFileSync(nuxtConfigPath, 'utf8');
      writeFileSync(path.join(ctx.fullPath, 'nuxt.config.js.bak'), nuxtConfigSourceString);
      const nuxtConfigString = this.transformConfig(nuxtConfigSourceString, ctx);
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
