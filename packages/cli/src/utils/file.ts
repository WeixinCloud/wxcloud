import { lstatSync, readdirSync, promises } from 'fs';
const { mkdir, writeFile } = promises;
import path from 'path';

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

export async function safeWriteFile(filePath: string, content: string) {
  const directory = path.dirname(filePath);
  if (!isDirectoryExists(directory)) {
    await mkdir(directory, { recursive: true });
  }
  await writeFile(filePath, content);
}
