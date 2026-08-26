import { Router } from 'express';
import * as taskController from '../controllers/task.controller';

/** Rutas REST de tareas, montadas bajo /list en app.ts. */
const router = Router();

router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.patch('/:id', taskController.edit);
router.delete('/:id', taskController.remove);

export default router;
