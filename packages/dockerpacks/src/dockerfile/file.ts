import { NonEmptyArray } from '@utils/types';
import { last } from 'lodash';

export class DockerIgnore {
  private files: string[] = [];

  append(...files: NonEmptyArray<string>) {
    this.files.push(...files);
  }

  build() {
    return this.files.join('\n');
  }
}

export interface BuildStage {
  commands: Command<any>[];
}

export interface AppendCommandCallback {
  comment: (comment: string) => void;
}

export class Dockerfile {
  private stages: BuildStage[] = [];

  get allStages(): ReadonlyArray<BuildStage> {
    return this.stages;
  }

  get currentStage() {
    return last(this.stages) || null;
  }

  from(...args: FromCommandArgs): AppendCommandCallback {
    this.stages.push({ commands: [] });

    const command = new FromCommand(args);
    this.currentStage!.commands.push(command);

    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  add(...args: AddCommandArgs): AppendCommandCallback {
    const command = new AddCommand(args);
    this.currentStage!.commands.push(command);

    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  copy(...args: CopyCommandArgs): AppendCommandCallback {
    const command = new CopyCommand(args);
    this.currentStage!.commands.push(command);

    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  run(...args: RunCommandArgs): AppendCommandCallback {
    const command = new RunCommand(args);
    this.currentStage!.commands.push(command);

    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  cmd(...args: CmdCommandArgs): AppendCommandCallback {
    const command = new CmdCommand(args);
    this.currentStage!.commands.push(command);
    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  env(...args: EnvCommandArgs): AppendCommandCallback {
    const command = new EnvCommand(args);
    this.currentStage!.commands.push(command);
    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  workdir(...args: WorkdirCommandArgs): AppendCommandCallback {
    const command = new WorkdirCommand(args);
    this.currentStage!.commands.push(command);
    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }

  expose(...args: ExposeCommandArgs): AppendCommandCallback {
    const command = new ExposeCommand(args);
    this.currentStage!.commands.push(command);
    return {
      comment: c => {
        command.setComment(c);
      }
    };
  }
}

export type ArgsItem = NonEmptyArray<string>;

function serializeArgsItem(argsItem: ArgsItem) {
  return argsItem
    .map(item => (item.includes(' ') ? `'${item.replaceAll("'", '"')}'` : item))
    .join(' ');
}

abstract class Command<T extends string[] | string[][]> {
  protected comment?: string;

  constructor(readonly name: string, protected readonly args: T) {}

  getDebugInfo(): [name: string, ...args: T] {
    return [this.name, ...this.args];
  }

  setComment(comment: string) {
    this.comment = comment;
  }

  serialize() {
    const comment = this.comment ? `# ${this.comment.split('\n').join('\n# ')}\n` : '';
    const args = this.serializeArgs();
    const name = this.name.toUpperCase();
    return `${comment}${name} ${args}`;
  }

  protected abstract serializeArgs(): string;
}

type FromCommandArgs = [image: string, version: string];

class FromCommand extends Command<FromCommandArgs> {
  constructor(args: FromCommandArgs) {
    super('from', args);
  }

  protected serializeArgs() {
    return this.args.join(':');
  }
}

type AddCommandArgs = [...from: ArgsItem, to: string];

class AddCommand extends Command<AddCommandArgs> {
  constructor(args: AddCommandArgs) {
    super('add', args);
  }

  protected serializeArgs() {
    return serializeArgsItem(this.args);
  }
}

type CopyCommandArgs = [...from: ArgsItem, to: string];

class CopyCommand extends Command<CopyCommandArgs> {
  constructor(args: CopyCommandArgs) {
    super('copy', args);
  }

  protected serializeArgs() {
    return serializeArgsItem(this.args);
  }
}

type RunCommandArgs = ArgsItem | NonEmptyArray<ArgsItem>;

function isMultipleArgs(args: RunCommandArgs): args is NonEmptyArray<ArgsItem> {
  return Array.isArray(args[0]);
}

class RunCommand extends Command<RunCommandArgs> {
  constructor(args: RunCommandArgs) {
    super('run', args);
  }

  protected serializeArgs() {
    const args = !isMultipleArgs(this.args)
      ? serializeArgsItem(this.args)
      : this.args.map(serializeArgsItem).join(' && \\\n    ');
    return args;
  }
}

type CmdCommandArgs = ArgsItem;

class CmdCommand extends Command<CmdCommandArgs> {
  constructor(args: CmdCommandArgs) {
    super('cmd', args);
  }

  protected serializeArgs() {
    return `["${this.args.join('", "')}"]`;
  }
}

type EnvCommandArgs = [key: string, value: string] | NonEmptyArray<[key: string, value: string]>;

class EnvCommand extends Command<EnvCommandArgs> {
  constructor(args: EnvCommandArgs) {
    super('env', args);
  }

  protected serializeArgs() {
    const items = !this.isArrayArgs(this.args) ? [this.args] : this.args;
    return items.map(([key, value]) => `${key}=${this.handleValue(value)}`).join(' ');
  }

  private isArrayArgs(input: EnvCommandArgs): input is NonEmptyArray<[key: string, value: string]> {
    return Array.isArray(input[0]);
  }

  private handleValue(value: string) {
    return value.includes(' ') ? `"${value.replaceAll('"', '\\"')}"` : value;
  }
}

type WorkdirCommandArgs = [dir: string];

class WorkdirCommand extends Command<WorkdirCommandArgs> {
  constructor(args: WorkdirCommandArgs) {
    super('workdir', args);
  }

  protected serializeArgs() {
    return this.args[0];
  }
}

type ExposeCommandArgs = [port: string];

class ExposeCommand extends Command<ExposeCommandArgs> {
  constructor(args: ExposeCommandArgs) {
    super('expose', args);
  }

  protected serializeArgs() {
    return this.args[0];
  }
}
