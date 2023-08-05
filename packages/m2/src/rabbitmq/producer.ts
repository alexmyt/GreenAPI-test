import { Channel } from 'amqplib';

import { RabbitMessage } from '../interfaces';
import { Logger } from '../logger/logger.interface';

export default class RabbitClientProducer {
  constructor(private channel: Channel, private logger: Logger) {}

  async produceMessage<T = RabbitMessage>(
    message: T,
    correlationId: string,
    replyToQueue: string,
  ): Promise<void> {
    this.channel.sendToQueue(replyToQueue, Buffer.from(JSON.stringify(message)), {
      correlationId,
    });
  }
}
