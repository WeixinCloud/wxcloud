import { merge } from "lodash";

export type ApiRegion = "ap-shanghai" | "ap-guangzhou" | "ap-beijing";

export interface ApiCommonParameters {
  region: ApiRegion;
}

let parameters: Partial<ApiCommonParameters> = {};

export function getApiCommonParameters() {
  return parameters;
}

export function setApiCommonParameters(input: Partial<ApiCommonParameters>) {
  merge(parameters, input);
}
