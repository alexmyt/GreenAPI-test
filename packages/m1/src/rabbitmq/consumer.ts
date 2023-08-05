import EventEmitter from 'node:events';

import { Channel, ConsumeMessage } from 'amqplib';

import { Logger } from '../logger/logger.interface';

export default class RabbitClientConsumer {
  constructor(
    private channel: Channel,
    private replyToQueue: string,
    private eventEmitter: EventEmitter,
    private logger: Logger,
  ) {}

  async consumeMessages(): Promise<void> {
    this.channel.consume(this.replyToQueue, (message: ConsumeMessage) => {
      const { correlationId } = message.properties;
      this.eventEmitter.emit(correlationId, message);

      this.logger.info(
        {
          queue: this.replyToQueue,
          correlationId,
          message: JSON.parse(message.content.toString()),
        },
        'Received message from queue',
      );
    });
  }
}
