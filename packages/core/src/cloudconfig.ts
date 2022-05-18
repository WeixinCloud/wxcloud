export type CloudKitType = 'universal' | 'static' | 'run';
export interface CloudConfig extends Record<string, any> {
  type: CloudKitType;
  server: string;
  client?: {
    target: string | string[];
    domain?: string;
  };
}

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  server: '.',
  type: 'run'
};

const convertToInlineObject = (input: Record<string, any>) =>
  JSON.stringify(input, null, 2).replaceAll(/^(\s*)"([^"]+)":/gim, '$1$2:');

export const DEFAULT_CLOUD_CONFIG_JS_CONTENT = `/** @type {import("@wxcloud/core").CloudConfig} */
const cloudConfig = ${convertToInlineObject(DEFAULT_CLOUD_CONFIG)}

module.exports = cloudConfig
`;
