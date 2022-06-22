import glob, { Options } from 'fast-glob';
import { fetchUrl } from '@utils/fetch';
import { FilterPromptRegistrationItem, PromptRegistration } from './types';
import { join, normalize } from 'path';
import { NonEmptyArray } from '@utils/types';
import { promises } from 'fs';
import { RequestInfo, RequestInit } from 'node-fetch';
import { ServerApi } from '@api/server';
import { trimStart } from 'lodash';
import { WXCLOUDRUN_FILES_DIR } from './constants';

const { readFile } = promises;

export class BuilderContext<P extends PromptRegistration = never> {
  readonly env: Environment;
  readonly files: Files;

  constructor(
    readonly appRoot: string,
    readonly api: ServerApi,
    readonly prompt: PromptHandler<P>,
    readonly message: MessageHandler
  ) {
    this.env = new Environment();
    this.files = new Files(this.appRoot);
  }

  panic(...messages: [string, ...any[]]): never {
    throw new Error(`Builder 执行出错: ${messages.join(' ')}`);
  }

  fetch(url: RequestInfo, init?: RequestInit) {
    return fetchUrl(url, init);
  }
}

export type MessageLevel = 'debug' | 'info' | 'warn' | 'error';

export interface MessageHandler {
  pass(level: MessageLevel, message: string): void;
}

export class NullMessageHandler implements MessageHandler {
  pass(level: MessageLevel, message: string) {}
}

export class Environment {
  private env = new Map<string, string | undefined>();

  has(key: string) {
    return this.env.has(key);
  }

  set(key: string, value?: string) {
    this.env.set(key, value);
  }

  mustGet(key: string) {
    if (!this.env.get(key)) {
      throw new Error(`env with key '${key}' not found or is falsy`);
    }
    return this.env.get(key)!;
  }
}

export class Files {
  private readonly cache = new Map<string, string>();

  private readonly globOptions: Options;

  readonly writtenFiles = new Map<string, string>();

  constructor(private readonly root: string) {
    this.globOptions = {
      cwd: this.root,
      onlyFiles: false,
      followSymbolicLinks: false,
      ignore: ['./**/node_modules/**/*'],
      deep: 10
    };
  }

  toRelativePath(path: string) {
    return trimStart(path.replace(this.root, ''), '/');
  }

  async glob(pattern: string, relativePath = true) {
    return (await glob(pattern, this.globOptions)).map(item =>
      relativePath ? item : join(this.root, item)
    );
  }

  async read(path: string) {
    const normalized = normalize(path);
    if (this.cache.has(normalized)) {
      return this.cache.get(normalized)!;
    }
    const content = await readFile(join(this.root, path), { encoding: 'utf8' });
    this.cache.set(normalized, content);
    return content;
  }

  async write(path: string, content: string) {
    const relativePath = join(WXCLOUDRUN_FILES_DIR, path);
    this.writtenFiles.set(relativePath, content);
    return relativePath;
  }

  async readJson(path: string): Promise<Record<string, any> | undefined> {
    if (!(await this.exists(path))) {
      return undefined;
    }

    const content = await this.read(path);
    if (!content) {
      return undefined;
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      // TODO: should we throw or log?
      return undefined;
    }
  }

  async exists(...files: NonEmptyArray<string>) {
    return await this.everyExists(...files);
  }

  async someExists(...files: NonEmptyArray<string>) {
    for (const file of files) {
      if ((await glob(file, this.globOptions)).length > 0) {
        return true;
      }
    }
    return false;
  }

  async everyExists(...files: NonEmptyArray<string>) {
    const result = await Promise.all(
      files.map(async file => (await glob(file, this.globOptions)).length > 0)
    );
    return result.every(x => x);
  }
}

export interface PromptBasicConfig<P extends PromptRegistration, V> {
  id: FilterPromptRegistrationItem<P, V>;
  caption: string;
}

export interface PromptInputConfig<P extends PromptRegistration, V, T>
  extends PromptBasicConfig<P, V> {
  validate?: RegExp | ((input: string) => boolean);
  trim?: boolean;
  transform?: (input: string) => T;
  default?: V;
}

export interface PromptSelectConfig<P extends PromptRegistration, V, T>
  extends PromptBasicConfig<P, V> {
  options: NonEmptyArray<string | [string, T]>;
}

export const PROMPT_NON_EMPTY = /.+/;

export abstract class PromptIO<P extends PromptRegistration = never> {
  protected __type__check__!: P;

  abstract ok(id: FilterPromptRegistrationItem<P, boolean>, caption: string): Promise<boolean>;

  abstract input(
    id: FilterPromptRegistrationItem<P, string | string[]>,
    caption: string
  ): Promise<string>;

  abstract select(
    id: FilterPromptRegistrationItem<P, string | string[]>,
    caption: string,
    options: NonEmptyArray<string>
  ): Promise<number>;
}

/*
 * 让 tsc 不在 dts 中抹除 PromptIO.__type__check__ 的类型的 hack
 */
class __type__check__<P extends PromptRegistration = never> extends PromptIO<P> {
  constructor() {
    super();
    void super.__type__check__;
  }

  ok(id: FilterPromptRegistrationItem<P, boolean>, caption: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  input(id: FilterPromptRegistrationItem<P, string | string[]>, caption: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  select(
    id: FilterPromptRegistrationItem<P, string | string[]>,
    caption: string,
    options: NonEmptyArray<string>
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
new __type__check__();

export class PromptHandler<P extends PromptRegistration> {
  private promptFailedCounts = new Map<string, number>();

  constructor(
    private readonly io: PromptIO<P>,
    private readonly messageHandler: MessageHandler,
    private readonly throwOnInvalidInput = false
  ) {}

  async ok(config: PromptBasicConfig<P, boolean>): Promise<boolean> {
    const answer = await this.io.ok(config.id, config.caption);
    return answer;
  }

  async input<T = string>(config: PromptInputConfig<P, string | string[], T>): Promise<T> {
    let answer: string | T;

    while (true) {
      answer = await this.io.input(config.id, config.caption);

      if (
        config.validate &&
        !(typeof config.validate === 'function'
          ? config.validate(answer)
          : config.validate.test(answer)) &&
        !config.default
      ) {
        const message = `输入无效，请检查格式是否正确`;

        if (this.throwOnInvalidInput) {
          throw new Error(message);
        } else {
          if (!this.promptFailedCounts.has(config.id)) {
            this.promptFailedCounts.set(config.id, 0);
          }
          const count = this.promptFailedCounts.get(config.id)!;
          if (count > 5) {
            throw new Error(`错误次数过多：${message}`);
          }
          this.promptFailedCounts.set(config.id, count + 1);
          this.messageHandler.pass('error', message);
        }
        continue;
      }

      this.promptFailedCounts.delete(config.id);
      break;
    }

    if (config.trim) {
      answer = answer.trim();
    }

    if (config.transform) {
      answer = config.transform(answer);
    }
    if (!answer && config.default) {
      return config.default as any;
    }
    return answer as any;
  }

  async select<T = string>(
    config: PromptSelectConfig<P, string | string[], T>
  ): Promise<string | T> {
    const flattenedOptions = config.options.map(item =>
      Array.isArray(item) ? item[0] : item
    ) as NonEmptyArray<string>;
    const answer = await this.io.select(config.id, config.caption, flattenedOptions);
    const target = config.options[answer];
    return Array.isArray(target) ? target[1] : target;
  }
}

export class HardCodedPromptIO<P extends PromptRegistration> extends PromptIO<P> {
  private readonly answerStates = new Map<string, number>();

  constructor(private readonly answers: P) {
    super();
  }

  async ok(id: string, caption: string) {
    if (!this.answers[id]) {
      throw new Error(`unexpected prompt: ${id}`);
    }
    return !!this.answers[id];
  }

  async input(id: string, caption: string) {
    if (!Reflect.has(this.answers, id)) {
      throw new Error(`unexpected prompt: ${id}`);
    }

    const answer = this.answers[id];
    if (!Array.isArray(answer)) {
      return `${answer}`;
    }

    if (!this.answerStates.has(id)) {
      this.answerStates.set(id, 0);
    }

    const index = this.answerStates.get(id)!;
    if (index >= answer.length) {
      return '';
    }
    this.answerStates.set(id, index + 1);
    return answer[index];
  }

  async select(id: string, caption: string, options: NonEmptyArray<string>) {
    if (!Reflect.has(this.answers, id)) {
      throw new Error(`unexpected prompt: ${id}`);
    }
    const answer = `${this.answers[id]}`;
    const result = options.findIndex(
      option => (Array.isArray(option) ? option[0] : option) === answer
    );
    if (result < 0) {
      throw new Error('invalid answer, no matching options');
    }
    return result;
  }
}
