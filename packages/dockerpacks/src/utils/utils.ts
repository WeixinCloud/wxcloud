export function optArg(flag: boolean, value: string | string[]) {
  return flag ? (Array.isArray(value) ? value : [value]) : [];
}
