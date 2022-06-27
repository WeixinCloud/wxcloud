import { IAPITCBServiceBaseConfig } from '@wxcloud/cloudapi';

export function preprocessBaseConfig(baseConfig: IAPITCBServiceBaseConfig) {
  const newBaseConfig = { ...baseConfig };
  if (newBaseConfig.policyThreshold && newBaseConfig.policyType) {
    newBaseConfig.policyDetails = [
      { policyThreshold: newBaseConfig.policyThreshold, policyType: newBaseConfig.policyType }
    ];
  } else {
    newBaseConfig.policyDetails = [{ policyThreshold: 60, policyType: 'cpu' }];
  }
  newBaseConfig.policyThreshold = 0;
  newBaseConfig.policyType = '';
  // ensure logType
  if (!newBaseConfig.logType) {
    newBaseConfig.logType = 'none';
  }
  return newBaseConfig;
}
