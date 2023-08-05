import { RabbitMessage, Task } from './interfaces';
import { type RabbitClient } from './rabbitmq/client';

export default class MessageHandler {
  constructor(private readonly client: RabbitClient) {}

  async handle(message: RabbitMessage, correlationId: string, replyTo: string): Promise<void> {
    const taskResult = this.echoTask(message);

    const reply = {
      ...taskResult,
      properties: {
        correlationId,
        replyTo,
      },
    };
    this.client.produce(reply, correlationId, replyTo);
  }

  // eslint-disable-next-line class-methods-use-this
  private echoTask(message: Task): Task {
    return message;
  }
}
