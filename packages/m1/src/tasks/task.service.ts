import { IncomingMessage } from 'node:http';

import { Task, TaskType } from '../interfaces';

export default class TaskService {
  public static fromRequest(req: IncomingMessage, body: Record<string, unknown>): Task {
    const RequestToTaskMap = {
      'get /echo': this.echoTask,
    };

    const { method, url } = req;

    const task = RequestToTaskMap[`${method} ${url}`.toLocaleLowerCase()];
    return task ? task(req, body) : this.undefinedTask();
  }

  private static undefinedTask(): Task {
    return { taskType: TaskType.UNKNOWN, taskData: {} };
  }

  private static echoTask(req: IncomingMessage, body: Record<string, unknown>): Task {
    return {
      taskType: TaskType.ECHO,
      taskData: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
      },
    };
  }
}
