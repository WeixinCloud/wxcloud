const path = require('path');
const webpack = require('webpack');

module.exports = env => {
  /** @type {import('webpack').Configuration} */
  return {
    mode: env.mode,
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    entry: path.resolve(__dirname, './src/extension.ts'),
    output: {
      // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, env.target === 'ide' ? 'out_ide' : 'out'),
      filename: (pathData) => {
        return pathData.chunk.name === 'main' ? 'extension.js' : 'node_modules.js';
      },
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    devtool: false,
    externals: {
      // the vscode-module is created on-the-fly and must be excluded.
      // Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      vscode: 'commonjs vscode',
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.js', '.json'],
      alias: {
        'miniprogram-ci': path.resolve(__dirname, 'src/libs/miniprogram-ci')
      },
      // modules: ['node_modules', 'src/libs/miniprogram-ci/node_modules'],
    },
    optimization: {
      minimize: false,
    },
    // output: {
    //   path: path.join(__dirname, '../dist'),
    //   filename: '[name].chunkhash.bundle.js',
    //   chunkFilename: '[name].chunkhash.bundle.js',
    //   publicPath: '/',
    //  },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            chunks: 'initial',
            name: 'vendor',
            enforce: true
          },
        }
      } 
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        },
      ]
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        IDE: env.target === 'ide',
        PUBLIC: env.target === 'public',
      }),
    ],
  };
};

