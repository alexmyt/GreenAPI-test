import { Channel, ConsumeMessage } from 'amqplib';

import { AMQP_QUEUE_NAME } from '../constants';
import { MessageHandler } from '../interfaces';
import { Logger } from '../logger/logger.interface';

export default class RabbitClientConsumer {
  constructor(private channel: Channel, private logger: Logger) {}

  async consumeMessages(messageHandler: MessageHandler): Promise<void> {
    this.channel.consume(AMQP_QUEUE_NAME, (message: ConsumeMessage) => {
      const messageContent = JSON.parse(message.content.toString());

      const { correlationId, replyTo } = message.properties;
      if (!correlationId || !replyTo) {
        this.logger.error({ correlationId, replyTo }, 'Missing some message properties...');
        return;
      }

      messageHandler.handle(messageContent, correlationId, replyTo);
    });
  }
}
