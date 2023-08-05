export type RabbitMessage = Task;

export enum TaskType {
  UNKNOWN = 'unknown',
  ECHO = 'echo',
}

export interface Task {
  taskType: TaskType;
  taskData: Record<string, unknown>;
}

export interface MessageHandler {
  handle: (message: RabbitMessage, correlationId: string, replyTo: string) => Promise<void>;
}
