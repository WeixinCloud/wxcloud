import path from 'path';
import { existsSync, readFileSync } from 'fs-extra';

export type RepositoryType = 'php' | 'javascript' | 'spring' | 'dotnet' | 'unknown';

export function detectRepositoryType(repoPath: string): RepositoryType {
  switch (true) {
    case isPhpTemplateRepo(repoPath):
      return 'php';
    case isJavaScriptTemplateRepo(repoPath):
      return 'javascript';
    case isSpringTemplateRepo(repoPath):
      return 'spring';
    case isDotnetTemplateRepo(repoPath):
      return 'dotnet';
  }

  return 'unknown';
}

function isPhpTemplateRepo(repoPath: string) {
  return someFileExists(repoPath, 'server.php', path.join('conf', 'php.ini'));
}

function isJavaScriptTemplateRepo(repoPath: string) {
  return everyFileExists(repoPath, 'package.json');
}

function isSpringTemplateRepo(repoPath: string) {
  const pomXmlPath = path.join(repoPath, 'pom.xml');
  if (!existsSync(pomXmlPath)) {
    return false;
  }
  const content = readFileSync(pomXmlPath, 'utf-8');
  return content.includes('<groupId>org.springframework.boot</groupId>');
}

function isDotnetTemplateRepo(repoPath: string) {
  return everyFileExists(repoPath, 'aspnetapp.sln');
}

function someFileExists(repoPath: string, ...files: [string, ...string[]]) {
  return files.some(name => existsSync(path.join(repoPath, name)));
}

function everyFileExists(repoPath: string, ...files: [string, ...string[]]) {
  return files.every(name => existsSync(path.join(repoPath, name)));
}
