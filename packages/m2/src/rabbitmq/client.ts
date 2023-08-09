import { Channel, Connection, connect } from 'amqplib';

import { AMQP_QUEUE_NAME, RABBIT_URL } from '../constants';
import { MessageHandlerClass, RabbitMessage } from '../interfaces';
import { Logger } from '../logger/logger.interface';

import RabbitClientProducer from './producer';
import RabbitClientConsumer from './consumer';

export class RabbitClient {
  private logger: Logger;

  private isInitialized: boolean;

  private static instance: RabbitClient;

  /** Connection to RabbitMQ */
  private connection: Connection;

  /** Channel to produce messages to server */
  private produceChannel: Channel;

  /** Channel to consume messages from server */
  private consumeChannel: Channel;

  private producer: RabbitClientProducer;

  private consumer: RabbitClientConsumer;

  private constructor() {
    this.isInitialized = false;
  }

  public static getInstance(): RabbitClient {
    if (!this.instance) {
      this.instance = new RabbitClient();
    }
    return this.instance;
  }

  public async initialize(logger: Logger): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger = logger;

    this.connection = await connect(RABBIT_URL);
    this.produceChannel = await this.connection.createChannel();
    this.consumeChannel = await this.connection.createChannel();

    await this.consumeChannel.assertQueue(AMQP_QUEUE_NAME, { exclusive: true });

    this.consumer = new RabbitClientConsumer(this.consumeChannel, this.logger);
    this.producer = new RabbitClientProducer(this.produceChannel, this.logger);

    this.isInitialized = true;

    this.logger.info('RabbitMQ client is initialized');
  }

  public consume(messageHandler: MessageHandlerClass): void {
    if (!this.isInitialized) {
      throw new Error('RabbitMQ client is not initialized');
    }

    this.consumer.consumeMessages(messageHandler);
  }

  public async produce<T = RabbitMessage>(
    message: T,
    correlationId: string,
    replyToQueue: string,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RabbitMQ client is not initialized');
    }
    return this.producer.produceMessage(message, correlationId, replyToQueue);
  }

  public async destroy(): Promise<void> {
    await this.connection.close();
  }
}

export default RabbitClient.getInstance();
