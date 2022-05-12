import { MessageHandler, MessageLevel, PromptIO } from '@builder/context';
import { NonEmptyArray } from '@utils/types';

export class TestMessageHandler implements MessageHandler {
  pass(message: string, level?: MessageLevel) {
    console.info(`${level ?? 'info'}: ${message}`);
  }
}

export type TestPromptAnswers = Record<string, boolean | string | string[]>;

export class TestPromptIO implements PromptIO {
  private readonly answerStates = new Map<string, number>();

  constructor(private readonly answers: TestPromptAnswers) {}

  async ok(id: string, caption: string) {
    if (!this.answers[id]) {
      throw new Error(`unexpected prompt: ${id}`);
    }
    return !!this.answers[id];
  }

  async input(id: string, caption: string) {
    if (!Reflect.has(this.answers, id)) {
      throw new Error(`unexpected prompt: ${id}`);
    }

    const answer = this.answers[id];
    if (!Array.isArray(answer)) {
      return `${answer}`;
    }

    if (!this.answerStates.has(id)) {
      this.answerStates.set(id, 0);
    }

    const index = this.answerStates.get(id)!;
    if (index >= answer.length) {
      return '';
    }
    this.answerStates.set(id, index + 1);
    return answer[index];
  }

  async select(id: string, caption: string, options: NonEmptyArray<string>) {
    if (!Reflect.has(this.answers, id)) {
      throw new Error(`unexpected prompt: ${id}`);
    }
    const answer = `${this.answers[id]}`;
    const result = options.findIndex(
      option => (Array.isArray(option) ? option[0] : option) === answer
    );
    if (result < 0) {
      throw new Error('invalid answer, no matching options');
    }
    return result;
  }
}
