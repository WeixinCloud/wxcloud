import * as vscode from 'vscode';
import type { IWXContainerId, IWXServerInfo } from '../types';
import type { WXContainersProvider } from '../ui/wxContainers';
import type { MessengerClient } from '../utils/messenger';
import type { IBackendService } from './backend/backend';

/**
 * global object within the extension, must be initialized in the extension's activate method
 */
let context: vscode.ExtensionContext;
let messenger: MessengerClient;
let backend: IBackendService;

let wxContainersProvider: WXContainersProvider;
let wxContainersTreeView: vscode.TreeView<IWXContainerId>;

let wxServerInfo: IWXServerInfo | undefined;

export default {
  context,
  messenger,
  backend,
  wxContainersProvider,
  wxContainersTreeView,
  wxServerInfo,
};
