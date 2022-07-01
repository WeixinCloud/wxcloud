const gulp = require('gulp');
const webpack = require('webpack');
const esbuild = require('esbuild');
const path = require('path');
const fse = require('fs-extra');
const yargs = require('yargs');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');

const args = yargs.option('target').argv;

const mode = args.mode || 'production';
const target = args.target || 'public';

const nativeNodeModulesPlugin = {
  name: 'native-node-modules',
  setup(build) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve 
    // it to an absolute path and put it into the "node-file" virtual namespace.
    build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
      path: require.resolve(args.path, { paths: [args.resolveDir] }),
      namespace: 'node-file',
    }))

    // Files in the "node-file" virtual namespace call "require()" on the
    // path from esbuild of the ".node" file in the output directory.
    build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
      contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `,
    }))

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, args => ({
      path: args.path,
      namespace: 'file',
    }))

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    let opts = build.initialOptions
    opts.loader = opts.loader || {}
    opts.loader['.node'] = 'file'
  },
}

const bundle = (done) => {
  const env = {
    mode,
    target,
  };

  const config = require(path.join(__dirname, 'webpack.config.js'))(env);
  webpack(config, (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      process.exit(200);
    }

    // Log result...
    console.log(stats.toString({
      chunks: false, // Makes the build much quieter
      colors: true // Shows colors in the console
    }));

    done();
  });
};

gulp.task('webpack', bundle);

gulp.task('copy:pkgjson', () => {
  const json = fse.readJSONSync('./package.json');
  json.main = './extension.js';
  fse.writeJSONSync(`./out${target === 'ide' ? '_ide' : ''}/package.json`, json, {
    spaces: 2
  });
  return gulp.src('package.*.json').pipe(gulp.dest(`out${target === 'ide' ? '_ide' : ''}`));
});

gulp.task('copy:resources', () => {
  return gulp.src(['resources/**']).pipe(gulp.dest(`out${target === 'ide' ? '_ide' : ''}/resources`));
});

gulp.task('copy:other', () => {
  return gulp.src(['README.md']).pipe(gulp.dest(`out${target === 'ide' ? '_ide' : ''}`));
});

gulp.task('copy', gulp.parallel([
  'copy:pkgjson',
  'copy:resources',
  'copy:other',
]));

gulp.task('inc-version', async done => {
  const filepath = path.join(__dirname, 'package.json');
  const json = fse.readJSONSync(filepath);
  // increase version number
  json.version = json.version.split('.').map((x, i) => i === 2 ? parseInt(x, 10) + 1 : x).join('.');
  // const properties = json.contributes.configuration[0].properties;
  // delete properties['wxcloud.containerDebug.appid'];
  // delete properties['wxcloud.containerDebug.ciKey'];
  fse.writeJSONSync(filepath, json, {
    spaces: 2,
  });
});

gulp.task('tweak-pkgjson-ide', async done => {
  const filepath = path.join(__dirname, 'out_ide', 'package.json');
  const json = fse.readJSONSync(filepath);
  const properties = json.contributes.configuration[0].properties;
  delete properties['wxcloud.containerDebug.appid'];
  delete properties['wxcloud.containerDebug.ciKey'];
  delete properties['wxcloud.containerDebug.cliKey'];
  fse.writeJSONSync(filepath, json, {
    spaces: 2,
  });
});

gulp.task('esbuild', () => {
  return esbuild.build({
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outfile: `${target === 'ide' ? 'out_ide' : 'out'}/extension.js`,
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node12',
    mainFields: ['module', 'main'],
    plugins: [nativeNodeModulesPlugin],
    define: {
      "process.env.WX_ENV_IDE": target === 'ide' ? true : undefined,
      "process.env.WX_ENV_PUBLIC": target === 'public' ? true : undefined,
    },
    minify: true,
  });
});

gulp.task('build', target === 'ide'
  ? gulp.series([
    'esbuild',
    'copy',
    'tweak-pkgjson-ide',
  ])
  : gulp.series([
    'inc-version',
    'esbuild',
    // 'copy',
  ])
);

// gulp.task('nls', () => {
// 	var r = tsProject.src()
// 		// .pipe(sourcemaps.init())
// 		.pipe(nls.rewriteLocalizeCalls())
// 		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n', 'out'));

// 	// if (inlineMap && inlineSource) {
// 	// 	r = r.pipe(sourcemaps.write());
// 	// } else {
// 	// 	r = r.pipe(sourcemaps.write("../out", {
// 	// 		// no inlined source
// 	// 		includeContent: inlineSource,
// 	// 		// Return relative source map root directories per file.
// 	// 		sourceRoot: "../src"
// 	// 	}));
// 	// }

// 	return r.pipe(gulp.dest(outDest))
// })

