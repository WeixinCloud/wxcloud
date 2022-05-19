import { flags } from '@oclif/command';

export const REGION_COMMAND_FLAG = flags.string({
  description: '地域',
  default: 'ap-shanghai',
  options: ['ap-shanghai', 'ap-guangzhou', 'ap-beijing']
});
