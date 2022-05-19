export const STAGE_TEXT: Record<string, string> = {
  BuildImage: '构建镜像',
  CreateCbrResource: '创建云托管资源',
  CreateEnv: '创建环境',
  CreateMysql: '创建数据库',
  CreateServer: '创建服务',
  CreateVersion: '创建版本',
  ExecuteSQL: '初始化数据库',
  ReleaseVersion: '发布版本',
  GrayRelease: '灰度测试',
  RunPipeline: '执行流水线'
};

export const STATUS_TEXT: Record<string, string> = {
  notInvolve: '已跳过',
  running: '进行中',
  failed: '失败',
  todo: '等待',
  finished: '完成',
  stopped: '已取消',
  unknown: ''
};

export const STAGE_COST: Record<string, string> = {
  BuildImage: '3 分钟',
  CreateCbrResource: '1 分钟',
  CreateEnv: '1 分钟',
  CreateMysql: '1 分钟',
  CreateServer: '1 分钟',
  CreateVersion: '1 分钟',
  ExecuteSQL: '1 分钟',
  ReleaseVersion: '1 分钟',
  RunPipeline: '2 分钟'
};
