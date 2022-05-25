import { MessageHandler, MessageLevel, PromptIO } from '@builder/context';

export class TestMessageHandler implements MessageHandler {
  pass(message: string, level?: MessageLevel) {
    console.info(`${level ?? 'info'}: ${message}`);
  }
}
