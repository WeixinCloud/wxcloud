import path from 'path';
import glob from 'fast-glob';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { isPromise } from 'util/types';

const concat = (strings, ...args) => {
  let result = '';
  for (let i = 0; i < Math.max(strings.length, args.length); i++) {
    result += `${strings[i] ?? ''}${args[i] ?? ''}`;
  }
  return result;
};

const $ = (strings, ...args) => execSync(concat(strings, ...args), { stdio: 'inherit' });

const log = (strings, ...args) => console.log(concat(strings, ...args));

const attempt = async (message, action, final) => {
  try {
    let value = action();
    if (isPromise(value)) {
      await value;
    }
  } catch (e) {
    throw new Error(`${message}: ${e.message}`);
  } finally {
    try {
      final?.();
    } catch {}
  }
};

const retry = async (action, maxTimes, delay) => {
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
};

const FIXTURES = glob.sync('./test/**/fixtures/*', {
  onlyFiles: false,
  onlyDirectories: true,
  absolute: true
});

main().catch(console.error);

async function main() {
  for (const fixturePath of FIXTURES) {
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
      await attempt(
        'Failed to start container',
        () => $`docker run -d -p 23333:${port} --name '${containerName}' '${imageName}' > /dev/null`
      );

      log`* Checking readiness on port ${port}`;
      await attempt(
        'Service failed to response',
        () => retry(() => $`curl -s --show-error localhost:23333 -o /dev/null`, 30, 3),
        () => $`docker rm --force '${containerName}' > /dev/null`
      );

      log`=== PASSED ===\n\n`;
    } catch (e) {
      log`=== FAILED ===`;
      throw e;
    }
  }
}
