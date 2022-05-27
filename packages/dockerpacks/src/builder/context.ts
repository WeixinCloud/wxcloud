import { join, normalize } from 'path';
import { trimStart } from 'lodash';
import glob, { Options } from 'fast-glob';
import { RequestInfo, RequestInit } from 'node-fetch';
import { ServerApi } from '@api/server';
import { NonEmptyArray } from '@utils/types';
import { fetchUrl } from '@utils/fetch';
import { WXCLOUDRUN_FILES_DIR } from './constants';
import { promises } from 'fs';
const { readFile } = promises;

export class BuilderContext<P extends string = string> {
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

export type MessageLevel = 'debug' | 'info' | 'warn' | 'fatal';

export interface MessageHandler {
  pass(message: string, level?: MessageLevel): void;
}

export class NullMessageHandler implements MessageHandler {
  pass(message: string, level?: MessageLevel | undefined) {}
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

export interface PromptBasicConfig<P extends string> {
  id: P;
  caption: string;
}

export interface PromptInputConfig<P extends string, T> extends PromptBasicConfig<P> {
  validate?: RegExp | ((input: string) => boolean);
  trim?: boolean;
  transform?: (input: string) => T;
}

export interface PromptSelectConfig<P extends string, T> extends PromptBasicConfig<P> {
  options: NonEmptyArray<string | [string, T]>;
}

export const PROMPT_NON_EMPTY = /.+/;

export interface PromptIO<P extends string = string> {
  ok(id: P, caption: string): Promise<boolean>;

  input(id: P, caption: string): Promise<string>;

  select(id: P, caption: string, options: NonEmptyArray<string>): Promise<number>;
}

export class PromptHandler<P extends string> {
  private promptFailedCounts = new Map<string, number>();

  // 这是为了一个约束：
  private alreadyPromptedIds = new Set();

  constructor(
    private readonly io: PromptIO<P>,
    private readonly messageHandler: MessageHandler,
    private readonly throwOnInvalidInput = false
  ) {}

  async ok(config: PromptBasicConfig<P>): Promise<boolean> {
    const answer = await this.io.ok(config.id, config.caption);
    return answer;
  }

  async input<T = string>(config: PromptInputConfig<P, T>): Promise<T> {
    let answer: string | T;

    while (true) {
      answer = await this.io.input(config.id, config.caption);

      if (
        config.validate &&
        !(typeof config.validate === 'function'
          ? config.validate(answer)
          : config.validate.test(answer))
      ) {
        const message = `输入无效，需要满足：${config.validate}`;
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
          this.messageHandler.pass(message);
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

    return answer as any;
  }

  async select<T = string>(config: PromptSelectConfig<P, T>): Promise<string | T> {
    const flattenedOptions = config.options.map(item =>
      Array.isArray(item) ? item[0] : item
    ) as NonEmptyArray<string>;
    const answer = await this.io.select(config.id, config.caption, flattenedOptions);
    const target = config.options[answer];
    return Array.isArray(target) ? target[1] : target;
  }
}

export class HardCodedPromptIO<P extends string> implements PromptIO<P> {
  private readonly answerStates = new Map<string, number>();

  constructor(private readonly answers: Record<P, boolean | string | string[]>) {}

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
