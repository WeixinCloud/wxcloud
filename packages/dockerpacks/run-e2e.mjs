import path from 'path';
import glob from 'fast-glob';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const concat = (strings, ...args) => {
  let result = '';
  for (let i = 0; i < Math.max(strings.length, args.length); i++) {
    result += `${strings[i] ?? ''}${args[i] ?? ''}`;
  }
  return result;
};
const $ = (strings, ...args) => execSync(concat(strings, ...args), { stdio: 'inherit' });
const log = (strings, ...args) => console.log(concat(strings, ...args));

const fixtures = glob.sync('./test/**/fixtures/*', {
  onlyFiles: false,
  onlyDirectories: true,
  absolute: true
});

for (const fixturePath of fixtures) {
  process.chdir(fixturePath);

  const name = path.basename(fixturePath);
  const imageName = `dockerpacks-test-${name}`;

  log`=== CASE ${name} ===`;
  if (existsSync('.__skip__')) {
    log`=== SKIPPED: .__skip__ presents ===`;
    continue;
  }
  if (!existsSync('Dockerfile')) {
    log`=== SKIPPED: missing Dockerfile ===`;
    continue;
  }

  try {
    log`building image ${imageName}`;
    $`docker build .  -t ${imageName}`;

    if (existsSync('.__build__only__')) {
      log`skipped running stage, .__build__only__ presents`;
      continue;
    }

    const content = readFileSync('Dockerfile', 'utf8');
    const port = [...content.matchAll(/^EXPOSE (.*)$/gim)][0][1];
    if (!port) {
      throw new Error('missing EXPOSE in Dockerfile');
    }

    const containerName = `test-container-${Math.random().toString(36).slice(2)}`;
    log`starting container ${containerName}`;
    attempt(
      'failed to start container',
      () => $`docker run -d -p 23333:${port} --name '${containerName}' '${imageName}' > /dev/null`
    );

    log`checking readiness on port ${port}`;
    attempt(
      'service failed to response',
      () =>
        $`curl --retry 20 --retry-all-errors --retry-delay 3 -s localhost:23333 > /dev/null 2>&1`,
      () => $`docker rm --force '${containerName}' > /dev/null`
    );

    log`=== PASSED ===\n\n`;
  } catch (e) {
    log`=== FAILED ===`;
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
