import mongoose from 'mongoose';
import { Task, ITask, TaskStatus } from '../models/task.model';
import { AppError } from '../utils/AppError';

/** Datos requeridos para crear una tarea (title es obligatorio). */
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

/** Datos aceptados para actualizar una tarea; todos los campos son opcionales. */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

/**
 * Capa de servicio: contiene las reglas de negocio y validaciones sobre tareas.
 * Los controladores solo delegan aquí; toda validación que no cubre el schema
 * de Mongoose (formato de id, transiciones de estado, etc.) vive en este archivo.
 */

/** Lanza AppError 400 si el id no tiene formato de ObjectId válido de Mongo. */
const assertValidId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Id invalido: ${id}`, 400);
  }
};

/** Devuelve todas las tareas, más recientes primero. */
export const getAll = async (): Promise<ITask[]> => {
  return Task.find().sort({ createdAt: -1 });
};

/** Busca una tarea por id. Lanza 400 si el id es inválido y 404 si no existe. */
export const getById = async (id: string): Promise<ITask> => {
  assertValidId(id);
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError(`No se encontro la tarea con id ${id}`, 404);
  }
  return task;
};

/** Crea una tarea. El título es obligatorio; description y status tienen valores por defecto. */
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

/** Actualiza parcialmente una tarea. Lanza 400 si el id o el status son inválidos, 404 si no existe. */
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

/** Elimina una tarea por id y devuelve el documento eliminado. Lanza 400/404 igual que getById. */
export const remove = async (id: string): Promise<ITask> => {
  assertValidId(id);
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    throw new AppError(`No se encontro la tarea con id ${id}`, 404);
  }
  return task;
};
