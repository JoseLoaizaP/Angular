import { Schema, model, Document } from 'mongoose';

/** Estados posibles del ciclo de vida de una tarea. */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

/** Forma de un documento de tarea tal como lo devuelve Mongoose. */
export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'El titulo es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
  },
  { timestamps: true },
);

/** Modelo Mongoose de tareas; persiste en la colección `tasks`. */
export const Task = model<ITask>('Task', taskSchema);
