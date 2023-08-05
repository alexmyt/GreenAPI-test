import loggerService from './logger/logger.service';
import MessageHandler from './messageHandler';
import rabbitClient from './rabbitmq/client';

const bootstrap = async (): Promise<void> => {
  await rabbitClient.initialize(loggerService);

  const messageHandler = new MessageHandler(rabbitClient);

  rabbitClient.consume(messageHandler);
};

bootstrap();
