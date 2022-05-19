import { lstatSync, readdirSync } from 'fs';

export function isDirectoryExistsAndEmpty(path: string) {
  return isDirectoryExists(path) && isDirectoryEmpty(path);
}

export function isDirectoryExists(path: string) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return false;
  }
  return stat && stat.isDirectory();
}

export function isDirectoryEmpty(path: string) {
  return readdirSync(path).length <= 0;
}
