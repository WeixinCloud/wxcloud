import * as vscode from 'vscode';
import ext from '../core/global';
import { IWXServerInfo } from '../types';

export function onServerInfo(data: IWXServerInfo) {
  ext.wxServerInfo = data;
  ext.wxContainersProvider.refresh();
}

interface IStartDebugOptions {
  name?: string;
}

export function onStartDebug(options: IStartDebugOptions) {
  vscode.commands.executeCommand('wxContainers.focus');
  if (options.name) {
    vscode.commands.executeCommand('wxContainers.start', options);
  }
}
