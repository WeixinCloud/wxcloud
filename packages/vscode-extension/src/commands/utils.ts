import * as vscode from 'vscode';
import ext from '../core/global';

interface ICommonCommandHandlingOptions {
  showError?: boolean;
  throwError?: boolean;
  refreshOnFinish?: boolean;
}

export function withCommonCommandHandling(
  fn: (...$args: any[]) => any,
  options: ICommonCommandHandlingOptions = {}
) {
  const { showError = true, throwError = true, refreshOnFinish = true } = options;

  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (e) {
      showError && vscode.window.showErrorMessage(`${e}`);
      if (throwError) {
        throw e;
      }
    } finally {
      refreshOnFinish && ext.wxContainersProvider.refresh();
    }
  };
}
