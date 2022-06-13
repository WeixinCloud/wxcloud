'use strict';

import * as vscode from 'vscode';

import ext from './core/global';
import { WXContainersProvider } from './ui/wxContainers';
import { withCommonCommandHandling } from './commands/utils';
import { debug, start } from './commands/start';
import { stop } from './commands/stop';
import { viewLogs } from './commands/viewLogs';
import { attachShell } from './commands/attachShell';
import { browseViaWxServer, browseDirectly } from './commands/openInBrowser';
import { openConfiguration } from './commands/openConfiguration';
import { addProxyNode } from './commands/addProxyNode';
import { attachService, detachService } from './commands/attachService';
import { onDidChangeVisibility } from './events/treeView';
import { onServerInfo, onStartDebug } from './events/wx';
import { setupConfiguration } from './configuration/configuration';
import { activateMessenger } from './utils/messenger';
import { IDEBackendService } from './core/backend/ide';
import { CoreBackendService } from './core/backend/core';
import { liveCoding } from './commands/liveCoding';

export function activate(context: vscode.ExtensionContext) {
  ext.context = context;
  ext.messenger = activateMessenger(context);

  const wxContainersProvider = new WXContainersProvider(context);
  vscode.window.registerTreeDataProvider('wxContainers', wxContainersProvider);
  // treeView.onDidChangeVisibility
  const wxContainersTreeView = vscode.window.createTreeView('wxContainers', {
    treeDataProvider: wxContainersProvider,
    canSelectMany: true
  });
  wxContainersTreeView.onDidChangeVisibility(onDidChangeVisibility);
  context.subscriptions.push(wxContainersTreeView);
  vscode.commands.registerCommand('wxContainers.refresh', () => wxContainersProvider.refresh());
  vscode.commands.registerCommand('wxContainers.refreshNode', objectId =>
    wxContainersProvider.refresh(objectId)
  );
  vscode.commands.registerCommand('wxContainers.start', withCommonCommandHandling(start));
  vscode.commands.registerCommand('wxContainers.liveCoding', withCommonCommandHandling(liveCoding));
  vscode.commands.registerCommand('wxContainers.restart', withCommonCommandHandling(start));
  vscode.commands.registerCommand(
    'wxContainers.rebuildStart',
    withCommonCommandHandling(objectId => start(objectId, undefined, true))
  );
  vscode.commands.registerCommand('wxContainers.stop', withCommonCommandHandling(stop));
  vscode.commands.registerCommand('wxContainers.viewLogs', viewLogs);
  vscode.commands.registerCommand('wxContainers.attachShell', attachShell);
  vscode.commands.registerCommand(
    'wxContainers.browseViaWxServer',
    withCommonCommandHandling(browseViaWxServer, { throwError: false })
  );
  vscode.commands.registerCommand(
    'wxContainers.browseDirectly',
    withCommonCommandHandling(browseDirectly, { throwError: false })
  );
  vscode.commands.registerCommand(
    'wxContainers.attachService',
    withCommonCommandHandling(attachService, { throwError: false })
  );
  vscode.commands.registerCommand(
    'wxContainers.detachService',
    withCommonCommandHandling(detachService, { throwError: false })
  );
  vscode.commands.registerCommand('wxContainers.debug', withCommonCommandHandling(debug));
  vscode.commands.registerCommand('wxContainers.openConfiguration', openConfiguration);
  vscode.commands.registerCommand('wxContainers.addProxyNode', addProxyNode);
  ext.wxContainersProvider = wxContainersProvider;
  ext.wxContainersTreeView = wxContainersTreeView;

  setupConfiguration(context);

  ext.backend = process.env.WX_ENV_IDE ? new IDEBackendService() : new CoreBackendService();

  ext.messenger.on('START_DEBUG', onStartDebug);
  ext.messenger.on('WX_SERVER_INFO', onServerInfo);

  (global as any).vscode = vscode;
  (global as any).ext = ext;
}
