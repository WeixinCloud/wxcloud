import * as vscode from 'vscode';
import ext from '../core/global';

export function onDidChangeVisibility(e: vscode.TreeViewVisibilityChangeEvent) {
  if (e.visible) {
    ext.wxContainersProvider.refresh();
  }
}

export function onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
  ext.wxContainersProvider.refresh();
}
