import path from 'path';
import glob from 'fast-glob';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { bgLightGreen, bgLightBlue, bgLightGray, bgRed } from 'kolorist';

const $ = command => execSync(command, { stdio: 'inherit' });
const _ = message => console.log(message);

const fixtures = glob.sync('./test/**/fixtures/*', {
  onlyFiles: false,
  onlyDirectories: true,
  absolute: true
});

for (const fixturePath of fixtures) {
  process.chdir(fixturePath);

  const name = path.basename(fixturePath);
  const imageName = `dockerpacks-test-${name}`;

  _`${bgLightBlue(' CASE ')} ${name}`;
  if (existsSync('.__skip__')) {
    _`${bgLightGray(' SKIPPED ')} .__skip__ presents`;
    continue;
  }
  if (!existsSync('Dockerfile')) {
    _`${bgLightGray(' SKIPPED ')} missing Dockerfile`;
    continue;
  }

  try {
    _`building image ${imageName}`;
    $`docker build .  -q -t ${imageName} > /dev/null`;

    if (existsSync('.__build__only__')) {
      _`skipped running stage, .__build__only__ presents`;
      continue;
    }

    const content = readFileSync('Dockerfile', 'utf8');
    const port = [...content.matchAll(/^EXPOSE (.*)$/gim)][0][1];
    if (!port) {
      throw new Error('missing EXPOSE in Dockerfile');
    }

    const containerName = `test-container-${Math.random().toString(36).slice(2)}`;
    _`starting container ${containerName}`;
    attempt(
      'failed to start container',
      () => $`docker run -d -p 23333:${port} --name '${containerName}' '${imageName}' > /dev/null`
    );

    _`checking readiness on port ${port}`;
    attempt(
      'service failed to response',
      () =>
        $`curl --retry 20 --retry-all-errors --retry-delay 3 -s localhost:23333 > /dev/null 2>&1`,
      () => $`docker rm --force '${containerName}'`
    );

    _`${bgLightGreen(' PASSED ')}\n\n`;
  } catch (e) {
    _`${bgRed(' FAILED ')}`;
    throw e;
  }
}

function attempt(message, action, final) {
  try {
    action();
  } catch (e) {
    throw new Error(`${message}: ${e.message}`);
  } finally {
    try {
      final?.();
    } catch {}
  }
}
