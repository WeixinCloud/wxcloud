export type CloudKitType = 'universal' | 'static' | 'run';
export interface CloudConfig extends Record<string, any> {
  type: CloudKitType;
  server: string;
  client?: {
    target: string | string[];
    domain?: string;
  };
}
