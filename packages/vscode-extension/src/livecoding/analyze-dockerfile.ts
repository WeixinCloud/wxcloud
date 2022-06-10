import { filter, findLast, head, groupBy, isArray, last, merge, take, values } from 'lodash';
import parser, { CommandEntry } from 'docker-file-parser';

export interface DevDockerfileElements {
  fromRaw: string
  necessaryCommandsRaw: string[]
  workdir: string
  entrypoint: string[] | null
}

export function analyzeDockerfile(dockerfile: string): DevDockerfileElements {
  const commands = parser.parse(dockerfile);
  const stagesCount = filter(commands, { name: 'FROM' }).length;
  console.assert(stagesCount > 0, 'missing FROM command');
  console.assert(stagesCount <= 2, 'currently only dockerfiles with two or less stages are supported');

  if (stagesCount <= 1) {
    return analyzeCommands(commands);
  }

  const stages = getDockerfileStages(commands);
  const buildStages = take(stages, stages.length - 1);
  const buildStageElements = mergeElements(buildStages.map(s => analyzeCommands(s)));
  const runStage = last(stages);
  const runStageElements = analyzeCommands(runStage);
  console.assert(!!runStageElements.entrypoint, 'the last stage of the dockerfile must contains a CMD or an ENTRYPOINT command');

  return merge(buildStageElements, {
    entrypoint: runStageElements.entrypoint,
  }) as DevDockerfileElements;
}

function analyzeCommands(commands: CommandEntry[]): DevDockerfileElements {
  const fromRaw = commands.find(c => c.name === 'FROM').raw;
  console.assert(fromRaw, 'missing FROM command'); // TODO: 处理错误

  // 只需要这几种必须的命令，像 LABEL 这样的就是多余的
  const necessaryCommandsRaw = commands.filter(c => ['COPY', 'ADD', 'RUN', 'WORKDIR'].includes(c.name)).map(c => c.raw);

  let entrypoint: string[] | null = null;
  const entryPoint = commands.find(c => c.name === 'ENTRYPOINT');
  if (entryPoint) {
    entrypoint = entryPoint.args as string[];
  } else {
    const cmdCommand = commands.find(c => c.name === 'CMD');
    entrypoint = cmdCommand?.args as string[] || null;
  }

  const workdir = head(filter(commands, { name: 'WORKDIR' })).args as string || '.';

  return {
    fromRaw,
    necessaryCommandsRaw,
    entrypoint,
    workdir,
  };
}

function getDockerfileStages(commands: CommandEntry[]) {
  const fromLinenos = filter(commands, { name: 'FROM' }).map(c => c.lineno);
  return values(groupBy(commands, ({ lineno }) => findLast(fromLinenos, fromLineno => lineno >= fromLineno)));
}

function mergeElements(elements: DevDockerfileElements[]): DevDockerfileElements {
  return elements.reduce((prev, curr) => merge(prev, curr, (a, b) => (isArray(a) ? a.concat(b) : undefined)), {}) as DevDockerfileElements;
}
