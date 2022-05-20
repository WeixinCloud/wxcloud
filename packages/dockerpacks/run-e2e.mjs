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
    log`=== SKIPPED: .__skip__ presents ===\n\n`;
    continue;
  }
  if (!existsSync('Dockerfile')) {
    log`=== SKIPPED: missing Dockerfile ===\n\n`;
    continue;
  }

  try {
    log`* Building image ${imageName}`;
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
    log`* Starting container ${containerName}`;
    attempt(
      'Failed to start container',
      () => $`docker run -d -p 23333:${port} --name '${containerName}' '${imageName}' > /dev/null`
    );

    log`* Checking readiness on port ${port}`;
    attempt(
      'Service failed to response',
      () => retry(() => $`curl localhost:23333`, 30, 3),
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

async function retry(action, maxTimes, delay) {
  let time = 0;
  while (true) {
    try {
      action();
      break;
    } catch (e) {
      if (time++ > maxTimes) {
        throw e;
      }

      await new Promise(resolve => void setTimeout(resolve, delay));
    }
  }
}
