import mongoose from 'mongoose';
import { Task, ITask, TaskStatus } from '../models/task.model';
import { AppError } from '../utils/AppError';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

const assertValidId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Id invalido: ${id}`, 400);
  }
};

export const getAll = async (): Promise<ITask[]> => {
  return Task.find().sort({ createdAt: -1 });
};

export const getById = async (id: string): Promise<ITask> => {
  assertValidId(id);
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError(`No se encontro la tarea con id ${id}`, 404);
  }
  return task;
};

export const create = async (input: CreateTaskInput): Promise<ITask> => {
  if (!input.title || !input.title.trim()) {
    throw new AppError('El titulo es obligatorio', 400);
  }
  return Task.create({
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? TaskStatus.PENDING,
  });
};

export const edit = async (id: string, input: UpdateTaskInput): Promise<ITask> => {
  assertValidId(id);
  if (input.status && !Object.values(TaskStatus).includes(input.status)) {
    throw new AppError(`Estado invalido: ${input.status}`, 400);
  }
  const task = await Task.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!task) {
    throw new AppError(`No se encontro la tarea con id ${id}`, 404);
  }
  return task;
};

export const remove = async (id: string): Promise<ITask> => {
  assertValidId(id);
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new AppError(`No se encontro la tarea con id ${id}`, 404);
  }
  return task;
};
