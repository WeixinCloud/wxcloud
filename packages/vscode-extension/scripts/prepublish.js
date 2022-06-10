const path = require('path');
const fse = require('fs-extra');

// verify the mandatory "out" folder and underlying files exists
const rootPath = path.join(__dirname, '..');
const outputExists = fse.existsSync(path.join(rootPath, 'out')) &&
  fse.existsSync(path.join(rootPath, 'out', 'extension.js'));

if (!outputExists) {
  console.error(`PLEASE ENSURE "OUT" FOLDER AND CONTENT EXISTS !!!`);
  process.exit(100);
}

