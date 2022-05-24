export type CloudKitType = 'universal' | 'static' | 'run' | 'custom';

interface IDeployOptions {
  port?: number; // 端口
  buildDir?: string; // 目标目录
  versionRemark?: string; // 版本备注
}
export interface IKitDeployTarget {
  staticTarget?: Record<string, string>;
  runTarget?: string;
}
export interface CloudConfig extends Record<string, any> {
  type: CloudKitType;
  server: IDeployOptions | string;
  client?: {
    customDomain?: string;
  };
  custom?: IKitDeployTarget;
}

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  server: {},
  type: 'run'
};

const convertToInlineObject = (input: Record<string, any>) =>
  JSON.stringify(input, null, 2).replace(/^(\s*)"([^"]+)":/gim, '$1$2:');

export const DEFAULT_CLOUD_CONFIG_JS_CONTENT = `/** @type {import("@wxcloud/core").CloudConfig} */
const cloudConfig = ${convertToInlineObject(DEFAULT_CLOUD_CONFIG)}

module.exports = cloudConfig
`;
