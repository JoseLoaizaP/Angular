import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { Task, TaskStatus } from '../src/models/task.model';
import { connectTestDB, clearTestDB, closeTestDB } from './testUtils';

describe('GET /list/:id', () => {
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

  it('devuelve la tarea cuando el id existe', async () => {
    const task = await Task.create({
      title: 'Tarea existente',
      description: 'Desc',
      status: TaskStatus.PENDING,
    });

    const res = await request(app).get(`/list/${task._id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tarea existente');
    expect(res.body._id).toBe(task._id.toString());
  });

  it('devuelve 404 cuando el id no existe', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/list/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no se encontro/i);
  });

  it('devuelve 400 cuando el id tiene formato invalido', async () => {
    const res = await request(app).get('/list/id-invalido');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalido/i);
  });
});
