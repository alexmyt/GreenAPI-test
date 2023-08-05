import http from 'node:http';

import rabbitClient from './rabbitmq/client';
import { HTTP_HOSTNAME, HTTP_PORT } from './constants';
import TaskService from './tasks/task.service';
import logger from './logger/logger.service';

async function bootstrap(): Promise<void> {
  await rabbitClient.initialize(logger);

  const server = http.createServer(async (req, res) => {
    const chunks: string[] = [];
    req.on('data', (chunk) => chunks.push(chunk));

    req.on('end', async () => {
      const body = JSON.parse(chunks.join('\n'));

      const message = TaskService.fromRequest(req, body);

      const reply = await rabbitClient.produce(message);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(reply));
      res.end();
    });
  });

  server.on('error', (err: Error & { code: string }) => {
    if (err?.code === 'EACCES') {
      logger.error(`No access to port: ${HTTP_PORT}`);
    }
  });

  server.listen(HTTP_PORT, HTTP_HOSTNAME, () => {
    logger.info(`Server running at http://${HTTP_HOSTNAME}:${HTTP_PORT}/`);
  });
}

bootstrap();
