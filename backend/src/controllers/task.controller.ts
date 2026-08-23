import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await taskService.getAll();
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.getById(req.params.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const edit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.edit(req.params.id, req.body);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await taskService.remove(req.params.id);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};
