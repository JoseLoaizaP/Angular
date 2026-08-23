import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { Task, TaskStatus } from '../src/models/task.model';
import { connectTestDB, clearTestDB, closeTestDB } from './testUtils';

describe('DELETE /list/:id', () => {
  let app: Application;

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  it('elimina una tarea existente y la devuelve', async () => {
    const task = await Task.create({
      title: 'Tarea a eliminar',
      description: 'Desc',
      status: TaskStatus.PENDING,
    });

    const res = await request(app).delete(`/list/${task._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(task._id.toString());

    const stored = await Task.findById(task._id);
    expect(stored).toBeNull();
  });

  it('devuelve 404 cuando el id no existe', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app).delete(`/list/${nonExistentId}`);

    expect(res.status).toBe(404);
  });

  it('devuelve 400 cuando el id tiene formato invalido', async () => {
    const res = await request(app).delete('/list/id-invalido');

    expect(res.status).toBe(400);
  });
});
