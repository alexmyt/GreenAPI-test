import { Channel, ConsumeMessage } from 'amqplib';

import { AMQP_QUEUE_NAME } from '../constants';
import { MessageHandlerClass } from '../interfaces';
import { Logger } from '../logger/logger.interface';

export default class RabbitClientConsumer {
  constructor(private channel: Channel, private logger: Logger) {}

  /**
   * Starts consuming messages from the RabbitMQ queue and passes them to the message handler.
   * @param {MessageHandler} messageHandler - The message handler object with a handle method.
   * @returns {Promise<void>} A promise that resolves when consuming is complete.
   */
  async consumeMessages(messageHandler: MessageHandlerClass): Promise<void> {
    this.channel.consume(AMQP_QUEUE_NAME, async (message: ConsumeMessage | null) => {
      if (message === null) {
        return;
      }

      const { correlationId, replyTo } = message.properties;
      if (!correlationId || !replyTo) {
        this.logger.error({ correlationId, replyTo }, 'Missing some message properties...');
        this.channel.reject(message, false);
        return;
      }

      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.content.toString());
      } catch (error) {
        this.logger.error({ correlationId, replyTo, error }, 'Error while passing message content');
        this.channel.reject(message, false);
        return;
      }

      try {
        await messageHandler.handle(parsedMessage, correlationId, replyTo);
      } catch (error) {
        this.logger.error({ correlationId, replyTo, error }, 'Error while handle message');
        this.channel.reject(message, false);
        return;
      }

      this.channel.ack(message);
    });
  }
}
