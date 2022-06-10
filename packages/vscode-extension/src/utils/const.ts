
// status=(created|restarting|running|removing|paused|exited|dead|terminated)
export const DockerStatusToIconName: Record<string, string> = {
  created: 'Stop',
  restarting: 'Run',
  running: 'Run',
  removing: 'Warning',
  paused: 'Pause',
  exited: 'Stop',
  terminated: 'Stop',
  dead: 'Error',
};
