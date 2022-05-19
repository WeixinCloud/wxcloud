import { cyan, yellow, red, lightGray, bold } from 'kolorist';

const DEBUG = lightGray(bold('调试'));
const INFO = cyan(bold('信息'));
const WARN = yellow(bold('警告'));
const ERROR = red(bold('错误'));

export function wrapDebug(message: string) {
  return `${DEBUG} ${lightGray(message)}`;
}

export function wrapInfo(message: string) {
  return `${INFO} ${message}`;
}

export function wrapWarn(message: string) {
  return `${WARN} ${message}`;
}

export function wrapError(message: string) {
  return `${ERROR} ${message}`;
}
