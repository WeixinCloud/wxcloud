import { Builder } from '@builder/builder';
import { GOLANG_GROUPS } from './golang';
import { JAVA_GROUPS } from './java';
import { NODE_GROUPS } from './node';
import { PHP_GROUPS } from './php';
import { PYTHON_GROUPS } from './python';

export type BuilderWithOptionalProp = [builder: Builder, optional: boolean];

export type BuilderGroupType = 'golang' | 'java' | 'php' | 'python' | 'node';

export interface BuilderGroup {
  type: BuilderGroupType;
  label: string;
  builders: Array<Builder | BuilderWithOptionalProp>;
}

export const DEFAULT_BUILDER_GROUPS: BuilderGroup[] = [
  ...GOLANG_GROUPS,
  ...JAVA_GROUPS,
  ...PHP_GROUPS,
  ...PYTHON_GROUPS,
  ...NODE_GROUPS
];

export function extractBuilder(input: Builder | BuilderWithOptionalProp): Builder {
  if (isBuilderWithOptionalProp(input)) {
    return input[0];
  }
  return input;
}

export function isBuilderWithOptionalProp(
  input: Builder | BuilderWithOptionalProp
): input is BuilderWithOptionalProp {
  return Array.isArray(input);
}
