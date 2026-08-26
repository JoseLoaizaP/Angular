import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';

/**
 * Controladores HTTP de tareas: traducen request/response de Express a llamadas
 * al service, y delegan cualquier error a `next()` para que lo resuelva errorHandler.
 */

/** GET /list — devuelve todas las tareas. */
export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await taskService.getAll();
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

/** GET /list/:id — devuelve una tarea por id (404 si no existe). */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.getById(req.params.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/** POST /list — crea una tarea a partir del body de la petición. */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/** PATCH /list/:id — actualiza parcialmente una tarea existente. */
export const edit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.edit(req.params.id, req.body);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/** DELETE /list/:id — elimina una tarea y devuelve el documento eliminado. */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.remove(req.params.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};
