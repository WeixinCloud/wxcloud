import { Builder } from '@builder/builder';
import { GOLANG_GROUPS } from './group/golang';
import { JAVA_GROUPS } from './group/java';
import { NODE_GROUPS } from './group/node';
import { PHP_GROUPS } from './group/php';
import { PYTHON_GROUPS } from './group/python';

export type BuilderWithOptionalProp = [builder: Builder, optional: boolean];

export interface BuilderGroup {
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
