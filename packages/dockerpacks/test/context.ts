import { MessageHandler, MessageLevel } from '@builder/context';

export class TestMessageHandler implements MessageHandler {
  pass(level: MessageLevel, message: string) {
    console.info(`${level ?? 'info'}: ${message}`);
  }
}
