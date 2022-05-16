import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, normalize } from 'path';
import { sync } from 'glob';
import { ServerApi } from '@api/server';
import { NonEmptyArray } from '@utils/types';
import { WXCLOUDRUN_FILES_DIR } from './constants';
import { fetchUrl } from '@utils/fetch';
import { RequestInfo, RequestInit } from 'node-fetch';
import { trimStart } from 'lodash';

export class BuilderContext {
  readonly env: Environment;
  readonly files: Files;

  constructor(
    readonly appRoot: string,
    readonly api: ServerApi,
    readonly prompt: PromptHandler,
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
  private readonly IGNORED_FILES = ['./**/node_modules/**/*'];
  private readonly cache = new Map<string, string>();

  readonly writtenFiles = new Map<string, string>();

  constructor(private readonly root: string) {}

  toRelativePath(path: string) {
    return trimStart(path.replace(this.root, ''), '/');
  }

  glob(pattern: string, relativePath = true) {
    return sync(pattern, { cwd: this.root }).map(item =>
      relativePath ? item : join(this.root, item)
    );
  }

  read(path: string) {
    const normalized = normalize(path);
    if (this.cache.has(normalized)) {
      return this.cache.get(normalized)!;
    }
    const content = readFileSync(join(this.root, path), { encoding: 'utf8' });
    this.cache.set(normalized, content);
    return content;
  }

  write(path: string, content: string) {
    const relativePath = join(WXCLOUDRUN_FILES_DIR, path);
    this.writtenFiles.set(relativePath, content);
    return relativePath;
  }

  readJson(path: string): Record<string, any> | undefined {
    return this.exists(path) ? JSON.parse(this.read(path)) : undefined;
  }

  exists(...files: NonEmptyArray<string>) {
    return this.everyExists(...files);
  }

  someExists(...files: NonEmptyArray<string>) {
    return files.some(f => sync(f, { cwd: this.root, ignore: this.IGNORED_FILES }).length > 0);
  }

  everyExists(...files: NonEmptyArray<string>) {
    return files.every(f => sync(f, { cwd: this.root, ignore: this.IGNORED_FILES }).length > 0);
  }
}

export interface PromptBasicConfig {
  id: string;
  // TODO: emoji
  caption: string;
}

export interface PromptInputConfig<T> extends PromptBasicConfig {
  validate?: RegExp;
  trim?: boolean;
  transform?: (input: string) => T;
}

export interface PromptSelectConfig<T> extends PromptBasicConfig {
  options: NonEmptyArray<string | [string, T]>;
}

export const PROMPT_NON_EMPTY = /.+/;

export interface PromptIO {
  ok(id: string, caption: string): Promise<boolean>;

  input(id: string, caption: string): Promise<string>;

  select(id: string, caption: string, options: NonEmptyArray<string>): Promise<number>;
}

export class PromptHandler {
  private promptFailedCounts = new Map<string, number>();

  constructor(
    private readonly io: PromptIO,
    private readonly messageHandler: MessageHandler,
    private readonly throwOnInvalidInput = false
  ) {}

  async ok(config: PromptBasicConfig): Promise<boolean> {
    const answer = await this.io.ok(config.id, config.caption);
    return answer;
  }

  async input<T = string>(config: PromptInputConfig<T>): Promise<T> {
    let answer: string | T;

    while (true) {
      answer = await this.io.input(config.id, config.caption);

      if (config.validate && !config.validate.test(answer)) {
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

  async select<T = string>(config: PromptSelectConfig<T>): Promise<string | T> {
    const flattenedOptions = config.options.map(item =>
      Array.isArray(item) ? item[0] : item
    ) as NonEmptyArray<string>;
    const answer = await this.io.select(config.id, config.caption, flattenedOptions);
    const target = config.options[answer];
    return Array.isArray(target) ? target[1] : target;
  }
}
