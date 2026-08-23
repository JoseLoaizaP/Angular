import request from 'supertest';
import { Application } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { Task, TaskStatus } from '../src/models/task.model';
import { connectTestDB, clearTestDB, closeTestDB } from './testUtils';

describe('PATCH /list/:id', () => {
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

  it('actualiza los campos enviados de una tarea existente', async () => {
    const task = await Task.create({
      title: 'Tarea original',
      description: 'Desc original',
      status: TaskStatus.PENDING,
    });

    const res = await request(app)
      .patch(`/list/${task._id}`)
      .send({ status: TaskStatus.COMPLETED });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(TaskStatus.COMPLETED);
    expect(res.body.title).toBe('Tarea original');
  });

  it('devuelve 404 cuando el id no existe', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/list/${nonExistentId}`)
      .send({ title: 'No importa' });

    expect(res.status).toBe(404);
  });

  it('devuelve 400 cuando el estado enviado es invalido', async () => {
    const task = await Task.create({ title: 'Tarea', description: '' });

    const res = await request(app)
      .patch(`/list/${task._id}`)
      .send({ status: 'estado-invalido' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/estado invalido/i);
  });
});
