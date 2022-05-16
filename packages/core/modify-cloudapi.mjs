import glob from 'glob';
import copy from 'recursive-copy';
import prepend from 'prepend-file';
import { readFile, writeFile } from 'fs/promises';

const TARGET_PATH = './src/cloud-api-modified';
const CLOUD_API_PATH = './src/cloud-api';
const OUTPUT_TYPES_FILE = `${TARGET_PATH}/src/types.ts`;

await copy(CLOUD_API_PATH, TARGET_PATH);

const decorationFiles = glob.sync(`${TARGET_PATH}/**/!(index).d.ts`);

const addExports = source => {
  let hasReference = false;
  const result = source
    .replaceAll(/^(interface|type)/gim, 'export $1')
    .replaceAll(/^declare (namespace)/gim, 'export $1')
    .replaceAll(/^\/\/\/.*$/gim, () => {
      hasReference = true;
      return '';
    });
  const identifiers = [...result.matchAll(/^export (?:interface|namespace|type) (\S*) /gim)].map(
    ([_, id]) => id
  );
  return [result, identifiers, hasReference];
};

const files = [];
const identifierSet = new Set();

await Promise.all(
  decorationFiles.map(async file => {
    const source = (await readFile(file)).toString();
    const [result, identifiers, hasReference] = addExports(source);
    identifiers.forEach(id => identifierSet.add(id));
    if (!hasReference) {
      files.unshift(result);
    } else {
      files.push(result);
    }
  })
);

await writeFile(OUTPUT_TYPES_FILE, files.join('\n\n'));

const importStmt = `import {${[...identifierSet].join(', ')}} from '@cloud-api-modified/types';`;

const sourceFiles = glob.sync(`${TARGET_PATH}/src/**/!(index|types).ts`);

await Promise.all(
  sourceFiles.map(async file => {
    await prepend(file, importStmt + '\n\n');
  })
);

await prepend(`${TARGET_PATH}/src/index.ts`, `export * from './types';\n\n`);

console.log(`已在 ${TARGET_PATH} 中生成 cloudapi 的修改版本`);
