export type NonEmptyArray<T> = [T, ...T[]];

export function isGenericNonEmptyArray(input: any): input is NonEmptyArray<unknown> {
  return Array.isArray(input) && isNonEmptyArray(input);
}

export function isNonEmptyArray<T = unknown>(input: Array<T>): input is NonEmptyArray<T> {
  return input.length > 0;
}
