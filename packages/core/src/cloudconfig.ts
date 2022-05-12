export interface CloudConfig extends Record<string, any> {
  type: "universal" | "static" | "run";
  server: string;
  client?: {
    target: string | string[];
    domain?: string;
  };
}
