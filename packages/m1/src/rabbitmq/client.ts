import EventEmitter from 'node:events';

import { Channel, Connection, connect } from 'amqplib';

import { RABBIT_URL } from '../constants';
import { RabbitMessage } from '../interfaces';
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

  /** EventEmitter for using in producer and consumer */
  private eventEmitter: EventEmitter;

  /** Instance of class that produce messages to queue */
  private producer: RabbitClientProducer;

  /** Instance of class that consume replies from queue */
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

  /**
   * Initializes the RabbitMQ client
   * @param logger - The logger instance
   */
  public async initialize(logger: Logger): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger = logger;

    this.connection = await connect(RABBIT_URL);
    this.produceChannel = await this.connection.createChannel();
    this.consumeChannel = await this.connection.createChannel();

    const { queue: replyToQueue } = await this.consumeChannel.assertQueue('', { exclusive: true });

    this.eventEmitter = new EventEmitter();
    this.producer = new RabbitClientProducer(
      this.produceChannel,
      replyToQueue,
      this.eventEmitter,
      this.logger,
    );
    this.consumer = new RabbitClientConsumer(
      this.consumeChannel,
      replyToQueue,
      this.eventEmitter,
      this.logger,
    );

    this.consumer.consumeMessages();

    this.isInitialized = true;
    this.logger.info('RabbitMQ client is initialized');
  }

  /**
   * Produces a message to the RabbitMQ server
   * @param message - The message to produce
   * @returns A promise that resolves with the reply from the server
   */
  public async produce<T = RabbitMessage>(message: T): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Rabbit client is not initialized...');
    }
    return this.producer.produceMessage(message);
  }
}

export default RabbitClient.getInstance();
