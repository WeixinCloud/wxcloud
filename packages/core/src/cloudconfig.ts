export type CloudKitType = 'universal' | 'static' | 'run';
export interface CloudConfig extends Record<string, any> {
  type: CloudKitType;
  server: string;
  client?: {
    target: string | string[];
    domain?: string;
  };
}

export const DefaultCloudConfig = `/** @type {import('@wxcloud/core').CloudConfig} */
const cloudConfig = {
  server: '.',
  type: 'run',
}

module.exports = cloudConfig
`;
