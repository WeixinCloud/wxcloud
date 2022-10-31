export function parseEnvParams(param?: string) {
  if (!param) return {};
  return param
    .replace(/^&|&$/g, '')
    .split('&')
    .reduce((obj, str) => {
      const [, k = '', v = ''] = str.split(/([^=]+)=?(.*)/);
      k && (obj[k] = v);
      return obj;
    }, {});
}
