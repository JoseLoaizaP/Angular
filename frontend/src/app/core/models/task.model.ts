export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En progreso' },
  { value: 'completed', label: 'Completada' },
];
