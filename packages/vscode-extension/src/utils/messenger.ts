import * as vscode from 'vscode';

import WebSocket = require('ws');

// constants
const EXTENSION_MESSENGER_REGISTER_COMMAND = '_workbench.extension.registerMessenger'; // typically no need to change
const EXTENSION_MESSENGER_CALLBACK_COMMAND = 'vscodeDockerWxCloudbase.messenger.callback'; // edit me
const MESSENGER_MAIN_PROTOCOL = 'EXTENSION'; // edit me
const MESSENGER_SUB_PROTOCOL = 'dockercloudbase'; // edit me
const MAX_CONNECT_RETRY_TIME = 3; // default to 3

// utilities and types
interface IStringKeyMap<T = any> {
  [propName: string]: T;
}
type FN<R = any> = (...args: any[]) => R;
const delay = (t: number) => new Promise<void>(res => setTimeout(res, t));
const getCallbackID = (function () {
  let callbackID = 1;
  return function () {
    callbackID += 1;
    return callbackID;
  };
})();
function wrappedCallback(callback: FN<void>, resolve: FN<void>) {
  const callbackID = getCallbackID();
  this.callbackMap[callbackID] = {
    callback,
    resolve
  };
  return callbackID;
}

// MessengerClient Implementation
// Provide an abstract layer over native WebSocket.
// Built on native websockets/ws only.
export class MessengerClient {
  private ws: WebSocket | undefined;
  private msgQueue: any[] = [];
  private retryCount = 0;
  private url = 'ws://127.0.0.1:9974';
  private protocol = 'PLUGIN';
  private callback = new Set<FN>();

  private callbackMap: {
    [id: number]: {
      callback: FN<void>;
      resolve: FN<void>;
    };
  } = {};
  private onEvent: {
    [eventName: string]: any;
  } = {};

  public connect(port: number, token: string, mainProtocol: string, subProtocol: string) {
    const protocol = `${mainProtocol}_${subProtocol}#${token}#`;
    const url = `ws://127.0.0.1:${port}`;
    const ws = new WebSocket(url, protocol);
    this.ws = ws;
    this.url = url;
    this.protocol = protocol;
    this.addEventListener();
  }
  public reconnect() {
    const ws = new WebSocket(this.url, this.protocol);
    this.ws = ws;
    this.addEventListener();
  }

  private addEventListener() {
    if (!this.ws)
      throw new Error('[Messenger] Fatal: adding ws event handler before initialization');
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.registerCallback((msg: IStringKeyMap) => {
      const { command, data } = msg;

      if (command === 'INVOKE_CALLBACK') {
        const { callbackID, res } = data;
        const item = this.callbackMap[callbackID];
        if (item) {
          typeof item.callback === 'function' && item.callback(res);
          typeof item.resolve === 'function' && item.resolve(res);
        }
        delete this.callbackMap[callbackID];
      }

      if (command === 'ON_EVENT') {
        console.log('vscode-docker-wx-cloudbase ON_EVENT', data);
        const { eventName, res } = data;
        const cb = this.onEvent[eventName];
        if (typeof cb === 'function') {
          cb(res);
        }
      }
    });
  }

  private async onClose() {
    await delay(150);
    if (this.retryCount < MAX_CONNECT_RETRY_TIME) {
      this.retryCount += 1;
      this.reconnect();
    } else {
      console.error(
        '[Messenger] Fatal: Failed to connect with Wechat IDE. Ensure your protocol is correct and you have added to ExtensionProtocols in IDE.'
      );
    }
  }

  private onMessage(event: { data: WebSocket.Data; type: string; target: WebSocket }) {
    try {
      if (typeof event.data !== 'string') {
        throw new Error(`invalid event data encoding with invalid type: ${typeof event.data}`);
      }
      const msg = JSON.parse(event.data);
      this.callback.forEach(fn => {
        try {
          fn.call(null, msg);
        } catch (error) {
          // callback fail: resume and continue
          console.error('[Messenger] Warning: callback invocation error', error);
        }
      });
    } catch (error) {
      // fail silently
      console.error('[Messenger] Fatal: onMessage error', error);
    }
  }

  private onError(error: any) {
    console.error('[Messenger] Fatal: ws error', error);
  }

  private onOpen() {
    const pendingQueue = this.msgQueue.slice();
    this.msgQueue = [];
    pendingQueue.forEach(msg => this.send(msg));
  }

  private registerCallback(cb: FN) {
    if (typeof cb === 'function') {
      this.callback.add(cb);
    } else {
      console.error('[Messenger] Warning: adding non function callback is effective no-op.');
    }
  }

  private removeCallback(cb: FN) {
    this.callback.delete(cb);
  }

  // native send
  private send<T>(msg: T) {
    try {
      if (!this.ws) {
        this.msgQueue.push(msg);
      } else {
        this.ws.send(JSON.stringify(msg));
      }
    } catch (error) {
      console.error('[Messenger] Fatal: send message error', error);
    }
  }

  get invoke() {
    return (command: string, data: any, cb?: FN<void>) =>
      new Promise(resolve => {
        const safeCb =
          typeof cb === 'function'
            ? cb
            : () => {
                /* noop */
              };
        this.send({
          command,
          data,
          callbackID: wrappedCallback.call(this, safeCb, resolve)
        });
      });
  }

  get on() {
    return (event: string, cb: any) => {
      this.onEvent[event] = cb;
    };
  }
}

export function activateMessenger(context: vscode.ExtensionContext): MessengerClient {
  // Messenger Callback -- do not edit
  const messenger = new MessengerClient();
  const commandHandler = (token: string, port: number) => {
    messenger.connect(port, token, MESSENGER_MAIN_PROTOCOL, MESSENGER_SUB_PROTOCOL);
  };

  (global as any).manualConnectMessenger = (token: string, port: number) => {
    messenger.connect(port, token, MESSENGER_MAIN_PROTOCOL, MESSENGER_SUB_PROTOCOL);
  };
  // no-op activate function
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodeDockerWxCloudbase.activate', () => {})
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(EXTENSION_MESSENGER_CALLBACK_COMMAND, commandHandler)
  );
  vscode.commands
    .executeCommand(EXTENSION_MESSENGER_REGISTER_COMMAND, {
      callback: EXTENSION_MESSENGER_CALLBACK_COMMAND,
      protocol: MESSENGER_MAIN_PROTOCOL
    })
    .then(
      () => {},
      () => {}
    );
  return messenger;
}
